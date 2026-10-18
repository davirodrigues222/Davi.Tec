import React, { useState } from 'react';
import { fazerLogin, cadastrarUsuario, recuperarSenha } from '../services/api';

interface Props {
  onLoginSuccess?: () => void;
}

export const Auth: React.FC<Props> = ({ onLoginSuccess }) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Estados de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Estados de Cadastro
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [nomeAssistencia, setNomeAssistencia] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [cadEmail, setCadEmail] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [cadConfirmarSenha, setCadConfirmarSenha] = useState('');
  const [concordouTermos, setConcordouTermos] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!loginEmail || !loginSenha) {
      setMensagem({ tipo: 'erro', texto: 'Informe seu e-mail e senha para continuar.' });
      return;
    }

    setLoading(true);
    try {
      const data = await fazerLogin(loginEmail, loginSenha);
      if (data.user) {
        const savedConfigs = localStorage.getItem('sig_apple_configs');
        const configs = savedConfigs ? JSON.parse(savedConfigs) : {};
        if (data.user.user_metadata?.nome_assistencia) {
          configs.nomeLoja = data.user.user_metadata.nome_assistencia;
          localStorage.setItem('sig_apple_configs', JSON.stringify(configs));
          window.dispatchEvent(new Event('storage_configs_updated'));
        }
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      let erroMsg = 'Erro ao realizar login. Verifique suas credenciais.';
      if (err.message?.includes('Invalid login credentials')) {
        erroMsg = 'E-mail ou senha incorretos.';
      } else if (err.message?.includes('Email not confirmed')) {
        erroMsg = 'E-mail não confirmado. Verifique sua caixa de entrada.';
      }
      setMensagem({ tipo: 'erro', texto: erroMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!nomeResponsavel || !nomeAssistencia || !whatsapp || !cadEmail || !cadSenha) {
      setMensagem({ tipo: 'erro', texto: 'Preencha todos os campos obrigatórios marcados com (*).' });
      return;
    }

    if (cadSenha.length < 6) {
      setMensagem({ tipo: 'erro', texto: 'A senha precisa ter pelo menos 6 caracteres.' });
      return;
    }

    if (cadSenha !== cadConfirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas informadas não coincidem.' });
      return;
    }

    if (!concordouTermos) {
      setMensagem({ tipo: 'erro', texto: 'Você precisa aceitar os Termos de Uso para prosseguir.' });
      return;
    }

    setLoading(true);
    try {
      const data = await cadastrarUsuario({
        email: cadEmail,
        password: cadSenha,
        nomeResponsavel,
        nomeAssistencia,
        whatsapp,
        cpfCnpj,
      });

      const savedConfigs = localStorage.getItem('sig_apple_configs');
      const configs = savedConfigs ? JSON.parse(savedConfigs) : {};
      configs.nomeLoja = nomeAssistencia.trim();
      configs.telefone = whatsapp.trim();
      if (cpfCnpj) configs.cnpj = cpfCnpj.trim();
      localStorage.setItem('sig_apple_configs', JSON.stringify(configs));
      window.dispatchEvent(new Event('storage_configs_updated'));

      if (data.session) {
        setMensagem({ tipo: 'sucesso', texto: 'Conta criada com sucesso! Entrando no sistema...' });
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setMensagem({
          tipo: 'sucesso',
          texto: 'Conta criada! Se o seu Supabase exigir confirmação por e-mail, verifique sua caixa de entrada antes de entrar.',
        });
        setModo('login');
        setLoginEmail(cadEmail);
      }
    } catch (err: any) {
      console.error('Erro de cadastro:', err);
      let erroMsg = err.message || 'Erro ao criar conta. Tente novamente.';
      if (err.message?.includes('User already registered')) {
        erroMsg = 'Este e-mail já está em uso.';
      }
      setMensagem({ tipo: 'erro', texto: erroMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperar = async () => {
    if (!loginEmail) {
      setMensagem({ tipo: 'erro', texto: 'Digite seu e-mail no campo acima para receber o link de recuperação.' });
      return;
    }

    setLoading(true);
    try {
      await recuperarSenha(loginEmail);
      setMensagem({
        tipo: 'sucesso',
        texto: 'Link de recuperação enviado para o seu e-mail com sucesso.',
      });
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Falha ao solicitar recuperação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080c14] text-zinc-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* ================= PAINEL ESQUERDO (BRANDING MONTEC SYSTEM) ================= */}
      <div className="relative flex-1 flex flex-col justify-between p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-zinc-800/60 overflow-hidden bg-[#070b12]">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Topo: Logo Montec System */}
        <div className="relative z-10 flex items-center space-x-3.5">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-blue-500/25 shrink-0 border border-blue-500/30 bg-[#0d131f]">
            <img
              src="/logo-montec.png"
              alt="Montec System"
              className="w-full h-full object-cover"
            />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-[#070b12]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
              Montec System
            </h1>
            <p className="text-xs text-blue-400 mt-1 font-semibold">Software de Gestão Técnica</p>
          </div>
        </div>

        {/* Chamada Principal (Login vs Cadastro) */}
        <div className="relative z-10 max-w-xl my-12 lg:my-auto">
          {modo === 'login' ? (
            <div className="space-y-6">
              <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase">
                OPERAÇÃO SOB CONTROLE
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Do balcão à bancada: o controle total da sua assistência técnica.
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Ordens de serviço, clientes, garantias e resultado financeiro em uma ferramenta feita sob medida para o seu laboratório.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <span className="inline-block text-xs font-bold tracking-widest text-blue-400 uppercase">
                COMECE AGORA
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Organize sua assistência desde a primeira ordem.
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Crie sua conta, cadastre os dados da loja e tenha uma visão clara dos serviços, custos e resultados.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="bg-[#0e1422]/90 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                  <p className="text-xs font-semibold text-zinc-300">Ordens e clientes</p>
                </div>
                <div className="bg-[#0e1422]/90 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                  <p className="text-xs font-semibold text-zinc-300">Controle financeiro</p>
                </div>
                <div className="bg-[#0e1422]/90 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                  <p className="text-xs font-semibold text-zinc-300">Garantias</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Painel Esquerdo */}
        <div className="relative z-10 pt-4">
          <p className="text-xs text-zinc-400 font-medium">
            Montec System · Gestão Especializada para Assistências
          </p>
        </div>
      </div>

      {/* ================= PAINEL DIREITO (FORMULÁRIOS) ================= */}
      <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col justify-between p-8 lg:p-14 bg-[#0a0e17] overflow-y-auto">
        <div className="my-auto max-w-md w-full mx-auto">
          {mensagem && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs sm:text-sm font-medium border flex items-start space-x-3 ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <span className="text-base leading-none">
                {mensagem.tipo === 'sucesso' ? '✓' : '⚠'}
              </span>
              <div className="flex-1">{mensagem.texto}</div>
            </div>
          )}

          {modo === 'login' ? (
            <div>
              <div className="mb-8">
                <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
                  ÁREA RESTRITA
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                  Acesse o sistema
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  Use suas credenciais de operador.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    E-MAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="gestor@suaassistencia.com.br"
                    className="w-full px-4 py-3 bg-[#0d131f] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      SENHA
                    </label>
                    <button
                      type="button"
                      onClick={handleRecuperar}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition"
                    >
                      Recuperar acesso
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginSenha}
                    onChange={(e) => setLoginSenha(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 bg-[#0d131f] border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-zinc-800/60 text-center">
                <p className="text-xs text-zinc-400">
                  Ainda não tem conta na assistência?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModo('cadastro');
                      setMensagem(null);
                    }}
                    className="font-bold text-blue-400 hover:text-blue-300 transition ml-1"
                  >
                    Crie sua conta
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
                  NOVA CONTA
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                  Crie sua conta
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                  Informe os dados do responsável e da assistência.
                </p>
              </div>

              <form onSubmit={handleCadastro} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      NOME DO RESPONSÁVEL *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeResponsavel}
                      onChange={(e) => setNomeResponsavel(e.target.value)}
                      placeholder="Davi Rodrigues"
                      className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      NOME DA ASSISTÊNCIA *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeAssistencia}
                      onChange={(e) => setNomeAssistencia(e.target.value)}
                      placeholder="Sampaio Cell"
                      className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      WHATSAPP *
                    </label>
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(85) 99999-9999"
                      className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      CPF OU CNPJ
                    </label>
                    <input
                      type="text"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      placeholder="Opcional"
                      className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    E-MAIL DE ACESSO *
                  </label>
                  <input
                    type="email"
                    required
                    value={cadEmail}
                    onChange={(e) => setCadEmail(e.target.value)}
                    placeholder="voce@suaassistencia.com.br"
                    className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      CRIE UMA SENHA *
                    </label>
                    <input
                      type="password"
                      required
                      value={cadSenha}
                      onChange={(e) => setCadSenha(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      CONFIRME A SENHA *
                    </label>
                    <input
                      type="password"
                      required
                      value={cadConfirmarSenha}
                      onChange={(e) => setCadConfirmarSenha(e.target.value)}
                      placeholder="Digite novamente"
                      className="w-full px-3.5 py-2.5 bg-[#0d131f] border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={concordouTermos}
                      onChange={(e) => setConcordouTermos(e.target.checked)}
                      className="mt-0.5 rounded bg-[#0d131f] border-zinc-700 text-blue-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[11px] sm:text-xs text-zinc-400 leading-tight">
                      Li e concordo com os{' '}
                      <span className="text-blue-400 hover:underline">Termos de Uso</span> e a{' '}
                      <span className="text-blue-400 hover:underline">Política de Privacidade</span>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 mt-3"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Criando conta...</span>
                    </>
                  ) : (
                    <span>Criar minha conta</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-zinc-800/60 text-center">
                <p className="text-xs text-zinc-400">
                  Já possui uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModo('login');
                      setMensagem(null);
                    }}
                    className="font-bold text-blue-400 hover:text-blue-300 transition ml-1"
                  >
                    Voltar para o login
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 text-center">
          <p className="text-[11px] text-zinc-400">
            Montec System · Versão 2.4.0
          </p>
        </div>
      </div>
    </div>
  );
};