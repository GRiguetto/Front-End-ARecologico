// =====================================================================
// Autenticação (login, sessão e proteção das telas).
// Contrato esperado do back-end:
//   POST {URL_API}/auth/login   corpo: { "email": "...", "senha": "..." }
//   200 -> { "token": "<JWT>", "usuario": { "id": 1, "nome": "...", "email": "...", "perfil": "ADMIN" } }
//   401 -> e-mail ou senha incorretos
// Depois do login, toda chamada envia  Authorization: Bearer <token>.
// Se alguma chamada responder 401, o usuário volta para a tela de login.
// =====================================================================
const CHAVE_SESSAO = 'arecologico_sessao';

// Usuário de teste: só funciona enquanto USAR_DADOS_FALSOS = true (config.js).
const USUARIO_TESTE = {
  email: 'admin@arecologico.com',
  senha: '123456',
  usuario: { id: 1, nome: 'Administrador', email: 'admin@arecologico.com', perfil: 'ADMIN' },
};

const FUNCIONARIO_TESTE = {
  email: 'funcionario@arecologico.com',
  senha: '123456',
  usuario: { id: 2, nome: 'Funcionário', email: 'funcionario@arecologico.com', perfil: 'FUNCIONARIO' },
};

const Autenticacao = {
  sessao() {
    try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
  },

  ehAdministrador() {
    return String(this.sessao()?.usuario?.perfil ?? '').trim().toUpperCase() === 'ADMIN';
  },

  exigirAdministrador() {
    if (!this.ehAdministrador()) throw new Error('Apenas administradores podem alterar registros.');
  },

  cabecalhos() {
    const sessao = this.sessao();
    return sessao ? { Authorization: `Bearer ${sessao.token}` } : {};
  },

  async entrar(email, senha) {
    let sessao;
    if (USAR_DADOS_FALSOS) {
      const usuario = [USUARIO_TESTE, FUNCIONARIO_TESTE]
        .find((teste) => email === teste.email && senha === teste.senha);
      if (!usuario) throw new Error('E-mail ou senha incorretos.');
      sessao = { token: 'token-de-teste', usuario: usuario.usuario };
    } else {
      const resposta = await fetch(`${URL_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      }).catch(() => { throw new Error('Servidor indisponível. Tente novamente em instantes.'); });
      if (resposta.status === 401) throw new Error('E-mail ou senha incorretos.');
      if (!resposta.ok) throw new Error('Não foi possível entrar agora. Tente novamente.');
      sessao = await resposta.json();
    }
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  },

  sair() {
    sessionStorage.removeItem(CHAVE_SESSAO);
    location.href = '/login.html';
  },

  exigirLogin() {
    if (!this.sessao()) {
      location.replace('/login.html');
      return;
    }
    const pagina = location.pathname.split('/').pop().toLowerCase();
    if (!this.ehAdministrador() && ['dashboard.html', 'relatorio.html'].includes(pagina)) {
      location.replace(location.pathname.toLowerCase().includes('/templates/') ? '../index.html' : 'index.html');
    }
  },
};

function iniciarTelaLogin() {
  if (Autenticacao.sessao()) { location.replace('index.html'); return; }
  const formulario = document.getElementById('formularioLogin');
  const mensagem = document.getElementById('mensagemLogin');
  document.getElementById('dicaTeste').hidden = !USAR_DADOS_FALSOS;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = formulario.querySelector('button');
    mensagem.textContent = '';
    botao.disabled = true;
    try {
      await Autenticacao.entrar(formulario.elements.email.value.trim(), formulario.elements.senha.value);
      location.href = 'index.html';
    } catch (erro) {
      mensagem.textContent = erro.message;
      botao.disabled = false;
    }
  });
}

if (document.getElementById('formularioLogin')) iniciarTelaLogin();
else if (!document.body.hasAttribute('data-publica')) Autenticacao.exigirLogin();
