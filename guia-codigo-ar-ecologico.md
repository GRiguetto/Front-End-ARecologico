# 📘 Guia do Código — AR Ecológico (Front-end)

> Explicação **do zero**, usando o **seu próprio código**.
> Foco total nos arquivos `.js`, mas com o HTML e o CSS no meio quando eles ajudam a entender.
> Tudo que aparece em blocos de código foi tirado dos seus arquivos.

---

## 📑 Sumário

1. [Visão geral: o que esse sistema é](#1-visão-geral-o-que-esse-sistema-é)
2. [Mini-curso: as ferramentas de JavaScript que aparecem no código](#2-mini-curso-as-ferramentas-de-javascript-que-aparecem-no-código)
3. [`config.js` — o interruptor](#3-configjs--o-interruptor)
4. [`autenticacao.js` — login e sessão](#4-autenticacaojs--login-e-sessão)
5. [`dados-exemplo.js` — o banco de mentirinha](#5-dados-exemplojs--o-banco-de-mentirinha)
6. [`script.js` — o coração do sistema](#6-scriptjs--o-coração-do-sistema)
7. [`configuracoes.js` — o botão ⚙](#7-configuracoesjs--o-botão-)
8. [`relatorios.js` — gerando PDF](#8-relatoriosjs--gerando-pdf)
9. [Como o HTML se encaixa em tudo isso](#9-como-o-html-se-encaixa-em-tudo-isso)
10. [Fluxos completos passo a passo](#10-fluxos-completos-passo-a-passo)
11. [Ligando ao back-end (Spring Boot)](#11-ligando-ao-back-end-spring-boot)
12. [Decisões de arquitetura: o porquê de cada escolha](#12-decisões-de-arquitetura-o-porquê-de-cada-escolha)
13. [🐛 Bugs e melhorias que encontrei lendo o código](#13--bugs-e-melhorias-que-encontrei-lendo-o-código)
14. [Glossário](#14-glossário)
15. [Exercícios para fixar](#15-exercícios-para-fixar)

---

## 1. Visão geral: o que esse sistema é

### 1.1 Em uma frase

É a **parte visual** (front-end) de um sistema de gestão para uma empresa de ar-condicionado: cadastro de clientes, contratos, equipamentos, ordens de serviço, funcionários, dashboard com gráficos e relatórios em PDF.

### 1.2 Front-end vs back-end (a analogia do restaurante 🍽️)

| No restaurante | No sistema | Onde está |
|---|---|---|
| Salão, cardápio, decoração | **HTML** (estrutura) + **CSS** (visual) | `.html` e `style.css` |
| Garçom | **JavaScript** (leva pedidos e traz respostas) | `.js` |
| Cozinha | **Back-end** (Spring Boot + banco SQL Server) | ainda **não existe aqui** |
| Geladeirinha do garçom, com pratos de plástico pra treinar | **localStorage** com dados falsos | `dados-exemplo.js` |

Seu código foi feito pra funcionar **nos dois cenários**:

- **Modo teste** (`USAR_DADOS_FALSOS = true`): não tem cozinha ainda, então o garçom usa a geladeirinha (o navegador guarda os dados).
- **Modo real** (`USAR_DADOS_FALSOS = false`): o garçom vai de verdade até a cozinha (o servidor) usando `fetch`.

> 💡 **A grande sacada do projeto:** o resto do código **não sabe** em qual modo está. Ele só pede "me dá a lista de clientes" e a resposta chega, de um jeito ou de outro. Você vai ver exatamente como isso funciona na seção do `Repositorio`.

### 1.3 Não tem framework

Não tem React, Vue, Angular, jQuery. É **JavaScript puro** (o pessoal chama de *vanilla JS*). Isso significa que **tudo que você vê é o navegador fazendo o trabalho dele**, sem mágica escondida. É ótimo pra aprender porque nada fica "escondido numa biblioteca".

### 1.4 É um site de várias páginas (MPA)

**MPA** = *Multi Page Application*. Cada tela é um arquivo `.html` separado (`Cliente.html`, `Dashboard.html`...). Quando você clica num link do menu, o navegador **carrega outra página inteira**.

O contrário seria **SPA** (*Single Page Application*), onde existe 1 página só e o JS troca o conteúdo (é o que React/Vue fazem).

**Por que MPA aqui?** É mais simples, e combina com o resto do projeto (Spring Boot + Thymeleaf trabalha muito bem com várias páginas). Cada página é independente: se uma quebrar, as outras continuam funcionando.

### 1.5 Mapa dos arquivos

| Arquivo | Papel | Em uma frase |
|---|---|---|
| `config.js` | Configuração | Liga/desliga o modo teste e diz onde está a API |
| `autenticacao.js` | Login | Guarda quem está logado e protege as telas |
| `dados-exemplo.js` | Dados falsos | Cria clientes, OS, contratos... pra você ver o sistema funcionando |
| `script.js` | **Núcleo** | CRUD genérico, menu, formatação e dashboard |
| `configuracoes.js` | Preferências | Botão ⚙: tema escuro, cor, tamanho de letra, acessibilidade |
| `relatorios.js` | PDF | Gera relatórios usando jsPDF |
| `style.css` | Visual | Cores, layout, tema escuro, responsivo |
| `login.html`, `index.html`, `Cliente.html`... | Telas | Casca quase vazia que o JS preenche |
| `logo.png` | Imagem | Logo branca com fundo transparente |
| `application.properties` | Back-end | Só tem `spring.application.name=demo` (projeto Spring ainda vazio) |
| `README.md` | Documentação | Contrato da API e passo a passo do back-end |

### 1.6 A ORDEM dos `<script>` importa (e muito!)

No final de cada página você tem algo assim (exemplo do `Cliente.html`):

```html
<script src="../static/js/config.js"></script>
<script src="../static/js/autenticacao.js"></script>
<script src="../static/js/dados-exemplo.js"></script>
<script src="../static/js/script.js"></script>
<script src="../static/js/configuracoes.js"></script>
```

O navegador carrega e executa **de cima pra baixo, um de cada vez**. E como **não** estamos usando módulos (`import`/`export`), tudo que um script declara no topo fica **visível pros scripts seguintes**. Ou seja, os arquivos "compartilham" um espaço comum.

Então cada arquivo só pode usar o que foi declarado **antes dele**:

```
config.js ──────────► declara URL_API e USAR_DADOS_FALSOS
     │
autenticacao.js ────► usa USAR_DADOS_FALSOS e URL_API           (precisa do config.js)
     │                declara Autenticacao
dados-exemplo.js ───► declara semearDadosDeExemplo()
     │
script.js ──────────► usa Autenticacao, semearDadosDeExemplo,
     │                URL_API, USAR_DADOS_FALSOS                (precisa dos 3 de cima)
     │                declara ENTIDADES, Repositorio, formatarMoeda, ...
     │
configuracoes.js ───► independente (só usa o #menu da página)
     │
relatorios.js ──────► usa ENTIDADES, Repositorio, formatarCelula,
                      carregarRotulos, formatarData...          (precisa do script.js)
```

**Se você trocar a ordem**, aparece no console (F12) algo como:

```
Uncaught ReferenceError: USAR_DADOS_FALSOS is not defined
```

Isso quer dizer: "você me pediu uma coisa que ainda não foi declarada".

> **Por que não usar módulos (`import`/`export`)?**
> Módulos são a forma "moderna" e mais organizada. Mas pra um projeto desse tamanho, scripts simples deixam tudo mais fácil de ler: você abre o arquivo e vê tudo. A desvantagem é essa dependência de ordem e o fato de que qualquer nome global pode colidir com outro. Se o projeto crescer muito, migrar pra módulos é o próximo passo natural.

### 1.7 Visão do fluxo (o que acontece quando você abre uma tela)

```
Você abre Cliente.html
        │
        ▼
Navegador lê o HTML  ──►  encontra  <section data-entidade="clientes"></section>   (vazia!)
        │
        ▼
Carrega os .js na ordem
        │
        ▼
autenticacao.js:   "tem sessão? não? então vai pro login"
        │
        ▼
script.js (últimas linhas):
   1. cria dados de exemplo (se modo teste)
   2. monta o menu lateral
   3. acha todo elemento com data-entidade e chama iniciarTelaCrud() nele
        │
        ▼
iniciarTelaCrud():  lê ENTIDADES['clientes']  ──►  constrói tabela, busca, formulário
        │
        ▼
Repositorio.listar('clientes')  ──►  (localStorage OU servidor)  ──►  linhas na tabela
```

> 🔑 **Repare:** o HTML não tem tabela nenhuma. Ele só tem uma `<section>` vazia com uma etiqueta (`data-entidade="clientes"`). **O JavaScript constrói a tela inteira a partir de uma descrição.** Essa é a ideia central do projeto, e vamos destrinchar na seção 6.

---

## 2. Mini-curso: as ferramentas de JavaScript que aparecem no código

Antes de ler os arquivos, vale conhecer as "peças de lego" que se repetem. Toda vez que aparecer algo estranho no código, volte aqui.

### 2.1 `const`, `let` e valores

```js
const URL_API = 'http://localhost:8080/api';   // const: o nome não pode ser reatribuído
let inicio = 0;                                // let: pode mudar depois
inicio = 50;
```

- Use `const` por padrão. Use `let` só quando o valor **precisa** mudar (como o `inicio` na `desenharRosca`).
- **Atenção:** `const` com objeto/lista **não congela o conteúdo**, só impede trocar o nome por outra coisa. Você ainda pode adicionar itens numa lista `const`.

### 2.2 Funções e arrow functions (`=>`)

Duas formas de escrever uma função:

```js
// forma clássica
function somar(a, b) { return a + b; }

// arrow function (seta)
const somar = (a, b) => a + b;
```

Sem chaves `{}` = o resultado da expressão **já é retornado** (retorno implícito). Com chaves, você precisa escrever `return`.

**Pegadinha do seu código** (`script.js`, linha 8):

```js
const campo = (nome, rotulo, tipo = 'text', extras = {}) => ({ nome, rotulo, tipo, ...extras });
```

Os **parênteses em volta das chaves** `({ ... })` existem porque, sem eles, o JS acharia que as chaves são o *corpo* da função e não um **objeto**. Os parênteses dizem: "isso aqui é um objeto sendo retornado".

### 2.3 Parâmetros com valor padrão

```js
(nome, rotulo, tipo = 'text', extras = {})
```

Se você chamar `campo('cidade', 'Cidade')`, o `tipo` vira `'text'` e o `extras` vira `{}` automaticamente. Só usa o padrão quando o argumento **não é passado**.

### 2.4 Template literals (crases)

```js
const nome = 'Maria';
const texto = `Olá, ${nome}!`;     // "Olá, Maria!"
```

Texto entre **crases** ``` ` ``` aceita:
- `${ ... }` pra colocar **qualquer expressão** dentro;
- **várias linhas** sem precisar de `\n`.

Seu projeto usa isso **o tempo todo** pra montar HTML dentro do JS:

```js
`<a href="${arquivo}" class="${arquivo === paginaAtual ? 'ativo' : ''}">${nome}</a>`
```

### 2.5 Objetos, "atalho de propriedade" e spread `...`

```js
const nome = 'Maria';
const idade = 30;

const pessoa = { nome, idade };            // atalho: o mesmo que { nome: nome, idade: idade }
const completa = { ...pessoa, cidade: 'Rio Preto' };   // copia tudo de pessoa + adiciona cidade
```

O `...` (spread) **"espalha"** o conteúdo de um objeto (ou lista) dentro de outro. É a forma de **copiar e acrescentar** sem alterar o original. Exemplos reais seus:

```js
{ ...registro, id: Date.now() }        // copia o registro e adiciona um id
[...lista, novoItem]                   // copia a lista e adiciona no final
{ 'Content-Type': 'application/json', ...Autenticacao.cabecalhos() }   // junta cabeçalhos
```

### 2.6 Desestruturação (tirar pedaços de dentro)

```js
const { editar, excluir } = evento.target.dataset;
// equivale a:
// const editar = evento.target.dataset.editar;
// const excluir = evento.target.dataset.excluir;

const [registros, rotulos] = await Promise.all([...]);
// pega o 1º item da lista e põe em "registros", o 2º em "rotulos"
```

Também funciona nos parâmetros da função:

```js
([nome, total]) => ...        // recebe uma lista de 2 itens e já separa
{ rotular = formatarOpcao, valor = String } = {}   // recebe um objeto e já tira as opções (com padrão)
```

### 2.7 `||` vs `??` e o `?.`

```js
valor || 0       // se valor for "falsy" (0, '', null, undefined, false) usa 0
valor ?? 0       // se valor for SÓ null ou undefined usa 0   ← mais preciso
usuario?.nome    // se usuario for null/undefined, devolve undefined em vez de dar erro
```

Exemplo do `montarMenu`:

```js
const usuario = Autenticacao.sessao()?.usuario ?? {};
```

Lendo: "pega a sessão; **se ela existir**, pega o `.usuario`; **se tudo isso der vazio**, usa um objeto vazio `{}`". Sem o `?.`, se não houvesse sessão (`null`), `null.usuario` **explodiria** com `TypeError`.

### 2.8 Métodos de lista (a ferramenta mais usada do projeto)

Imagine `const nums = [1, 2, 3, 4]`:

| Método | O que faz | Exemplo | Resultado |
|---|---|---|---|
| `.map(f)` | **Transforma** cada item | `nums.map(n => n * 2)` | `[2, 4, 6, 8]` |
| `.filter(f)` | **Mantém** só os que passam no teste | `nums.filter(n => n > 2)` | `[3, 4]` |
| `.find(f)` | Acha o **primeiro** que passa | `nums.find(n => n > 2)` | `3` |
| `.reduce(f, inicial)` | **Junta tudo** em 1 valor | `nums.reduce((t, n) => t + n, 0)` | `10` |
| `.sort(f)` | Ordena (**altera** a lista!) | `[...nums].sort((a, b) => b - a)` | `[4, 3, 2, 1]` |
| `.slice(a, b)` | Pega um pedaço | `nums.slice(0, 2)` | `[1, 2]` |
| `.includes(x)` | Tem esse item? | `nums.includes(3)` | `true` |
| `.join(sep)` | Junta em texto | `['a','b'].join('-')` | `'a-b'` |

E pra objetos:

```js
Object.entries({ a: 1, b: 2 })        // [['a', 1], ['b', 2]]
Object.keys({ a: 1, b: 2 })           // ['a', 'b']
Object.values({ a: 1, b: 2 })         // [1, 2]
Object.fromEntries([['a', 1]])        // { a: 1 }    (o inverso do entries)
```

> 🧠 **O truque mental do `.map(...).join('')`:** o projeto transforma uma lista de dados em uma lista de textos HTML (`map`) e depois cola tudo num texto só (`join('')`). Isso aparece em quase toda parte.

### 2.9 `Map` e `Set`

```js
const nomes = new Map([[1, 'Maria'], [2, 'João']]);
nomes.get(2)       // 'João'
nomes.has(5)       // false

const ids = new Set([1, 2, 2, 3]);   // guarda sem repetir: {1, 2, 3}
ids.has(2)         // true
```

- **`Map`** = dicionário "chave → valor" (a chave pode ser número, o que um objeto comum não faz tão bem).
- **`Set`** = conjunto sem repetição, ótimo pra perguntar "esse item está aqui?" **muito rápido**.

Por que são rápidos? Procurar com `.find()` numa lista de 1.000 itens olha item por item. O `Map.get()` vai **direto** no item. Quando você precisa procurar muitas vezes, `Map` é muito melhor.

### 2.10 Código assíncrono: `Promise`, `async` e `await`

Buscar dados no servidor **demora** (milissegundos ou segundos). O JS não pode travar a tela esperando. Então ele usa **Promises**: "uma promessa de que o resultado vai chegar".

```js
async function exemplo() {
  const resposta = await fetch('http://.../clientes');   // "espere chegar antes de continuar"
  const dados = await resposta.json();                   // "espere converter o texto em dados"
  return dados;
}
```

- `async` na frente da função = "essa função devolve uma Promise e pode usar `await` dentro".
- `await` = "pause **aqui dentro** até a Promise terminar" (o resto da página continua viva).
- Se algo der errado, a Promise é **rejeitada** e vira um erro que você pega com `try/catch`.

**`Promise.all`** roda várias coisas **ao mesmo tempo** e espera todas:

```js
const [registros, rotulos] = await Promise.all([
  Repositorio.listar(entidade.recurso),   // começa agora
  carregarRotulos(entidade),              // começa agora também
]);
```

Se cada uma demora 1s, em fila seriam 2s; com `Promise.all`, **1s**.

### 2.11 `fetch` e JSON

`fetch` é o "garçom" que vai ao servidor.

```js
const resposta = await fetch(URL_API + caminho, {
  method: 'POST',                                   // GET (buscar) | POST (criar) | PUT (editar) | DELETE (apagar)
  headers: { 'Content-Type': 'application/json' },  // "estou mandando JSON"
  body: JSON.stringify({ nome: 'Maria' }),          // objeto → texto
});
```

**JSON** é o formato de texto em que o front e o back conversam:

```js
JSON.stringify({ nome: 'Maria' })     // objeto → '{"nome":"Maria"}'  (pra enviar/guardar)
JSON.parse('{"nome":"Maria"}')        // texto → objeto                (pra usar)
```

> ⚠️ **Pegadinha clássica do `fetch`:** ele só dá erro se a **internet/servidor caiu**. Se o servidor responder **404** ou **500**, o `fetch` considera "deu certo" (ele conseguiu conversar!). Por isso o seu `requisitar` verifica `resposta.ok` manualmente. Você vai ver isso na seção 6.2.

### 2.12 CRUD e REST

**CRUD** = as 4 operações básicas de qualquer cadastro:

| Letra | Significa | Requisição HTTP | Rota do seu projeto |
|---|---|---|---|
| **C** | Create (criar) | `POST` | `POST /clientes` |
| **R** | Read (ler) | `GET` | `GET /clientes` |
| **U** | Update (editar) | `PUT` | `PUT /clientes/5` |
| **D** | Delete (apagar) | `DELETE` | `DELETE /clientes/5` |

**REST** é o "padrão de etiqueta" pra montar essas rotas: o **substantivo** (`clientes`) diz *o quê*; o **verbo HTTP** diz *o que fazer*. O `/5` no fim diz *qual registro*.

### 2.13 DOM: o JS mexendo na página

O **DOM** é a "versão viva" do HTML dentro do navegador. O JS consegue **achar** e **alterar** qualquer pedaço:

```js
document.getElementById('menu')            // acha 1 elemento pelo id
document.querySelector('[data-sair]')      // acha o 1º elemento que casa com o seletor CSS
document.querySelectorAll('[data-entidade]')  // acha TODOS

elemento.innerHTML = '<b>oi</b>'           // troca o HTML de dentro
elemento.textContent = 'oi'                // troca só o texto (mais seguro)
elemento.hidden = true                     // esconde
elemento.disabled = true                   // desativa (botão/campo)
elemento.classList.add('ativo')            // liga uma classe CSS
elemento.classList.toggle('zebra', true)   // liga/desliga conforme o 2º argumento
elemento.dataset.entidade                  // lê o atributo data-entidade="..."
```

### 2.14 Atributos `data-*`: etiquetas pro JS

Qualquer atributo que começa com `data-` é **livre**: o navegador ignora, mas o JS lê.

```html
<section data-entidade="clientes"></section>
<button data-editar="7">Editar</button>
```

```js
secao.dataset.entidade     // "clientes"
botao.dataset.editar       // "7"      (SEMPRE texto! por isso o projeto usa Number(...))
```

> 🎯 **Convenção do projeto:** **classes** (`class="..."`) são pra o **CSS** estilizar; **atributos `data-*`** são pro **JS** encontrar os elementos. Assim você muda o visual sem quebrar a lógica, e vice-versa.

### 2.15 Eventos

Um **evento** é "algo aconteceu" (clicou, digitou, enviou o formulário...). Você escuta com `addEventListener`:

```js
botao.addEventListener('click', () => { ... });
```

Eventos usados no projeto:

| Evento | Quando dispara |
|---|---|
| `click` | Clicou |
| `input` | A cada tecla digitada no campo |
| `change` | O valor de um campo mudou (e saiu do campo / escolheu opção) |
| `submit` | Formulário enviado |

O argumento que chega na função (`evento`) traz informações: `evento.target` é **o elemento exato** onde aconteceu. E `evento.preventDefault()` **cancela o comportamento padrão do navegador** (ex.: o formulário recarregar a página).

### 2.16 `localStorage` vs `sessionStorage`

Um "cofrinho" do navegador pra guardar **texto**:

| | `localStorage` | `sessionStorage` |
|---|---|---|
| Dura | **Pra sempre** (até limpar) | Só **enquanto a aba está aberta** |
| Compartilhado entre abas | Sim | **Não** (cada aba tem o seu) |
| Uso no projeto | Dados de exemplo e preferências (⚙) | **Sessão de login** |

```js
localStorage.setItem('chave', 'texto');
localStorage.getItem('chave');      // 'texto'  (ou null se não existe)
localStorage.removeItem('chave');
```

Como só guardam **texto**, objetos precisam passar por `JSON.stringify` (guardar) e `JSON.parse` (ler).

### 2.17 Datas como texto `yyyy-MM-dd`

O projeto guarda datas como texto **ISO**: `"2026-11-14"`. Isso tem um superpoder: **comparar como texto funciona na ordem cronológica**:

```js
'2026-11-14' >= '2026-11-01'    // true  ✅
```

Funciona porque o formato vai do maior pro menor (ano, mês, dia) e sempre tem o mesmo tamanho. Se fosse `14/11/2026`, a comparação **quebraria**. É por isso que o README manda o back-end sempre mandar `yyyy-MM-dd`.

---

## 3. `config.js` — o interruptor

O arquivo inteiro:

```js
const URL_API = 'http://localhost:8080/api';
const USAR_DADOS_FALSOS = true;
```

São só **duas linhas**, mas são as mais importantes do projeto inteiro.

| Constante | O que é | Quem usa |
|---|---|---|
| `URL_API` | Endereço do back-end (Spring Boot roda na porta 8080 por padrão) | `requisitar()` e `Autenticacao.entrar()` |
| `USAR_DADOS_FALSOS` | O **interruptor**: `true` = modo teste, `false` = modo real | `Repositorio`, `Autenticacao`, tela de login e inicialização |

### Por que um arquivo só pra isso?

Pra existir **um único lugar** onde você mexe quando for integrar. Se esses valores estivessem espalhados pelos arquivos, você ia esquecer algum. Isso é o princípio **DRY** (*Don't Repeat Yourself* — "não se repita"): uma informação, um endereço.

### Por que MAIÚSCULAS?

É uma convenção: nomes em MAIÚSCULA com `_` indicam **constantes de configuração** (valores que não mudam durante a execução). É só um sinal visual pra quem lê.

> 🔌 **Quando o back-end ficar pronto você muda ISSO e mais nada:**
> ```js
> const URL_API = 'http://localhost:8080/api';
> const USAR_DADOS_FALSOS = false;
> ```

---

## 4. `autenticacao.js` — login e sessão

### 4.1 O que ele resolve

Três problemas:

1. **Fazer login** (verificar e-mail/senha).
2. **Lembrar** quem está logado enquanto você navega entre páginas.
3. **Barrar** quem tenta abrir uma tela sem estar logado.

### 4.2 Por que precisa "lembrar"? (conceito de sessão)

Numa MPA, cada clique **carrega uma página nova** e o JS da página anterior **morre**. Todas as variáveis somem. Então, pra "lembrar" que você logou, é preciso guardar a informação **fora do JS**: no `sessionStorage` do navegador. É esse o papel de `CHAVE_SESSAO`:

```js
const CHAVE_SESSAO = 'arecologico_sessao';
```

É o **nome da gavetinha** onde a sessão fica guardada. O prefixo `arecologico_` evita colidir com outros sites/sistemas que rodem no mesmo endereço (ex.: `localhost:5500` serve vários projetos seus!).

### 4.3 O usuário de teste

```js
const USUARIO_TESTE = {
  email: 'admin@arecologico.com',
  senha: '123456',
  usuario: { id: 1, nome: 'Administrador', email: 'admin@arecologico.com', perfil: 'ADMIN' },
};
```

Só vale no modo teste. Repare na estrutura: `usuario` aninhado dentro tem **a mesma forma** que o back-end vai devolver no login (`{ id, nome, email, perfil }`). Assim, quando trocar pro real, o resto do código **não percebe a diferença**.

### 4.4 O objeto `Autenticacao`

```js
const Autenticacao = {
  sessao() { ... },
  cabecalhos() { ... },
  async entrar(email, senha) { ... },
  sair() { ... },
  exigirLogin() { ... },
};
```

Aqui o projeto usa um **objeto como "gaveta de funções relacionadas"**. Vantagens:

- **Organização:** tudo de login fica agrupado. Você escreve `Autenticacao.sair()` e já sabe de onde vem.
- **Evita colisão de nomes:** se existisse uma função global `sair()` em outro lugar, brigaria. Dentro do objeto, não.
- Dentro dos métodos, `this` significa "esse próprio objeto" (por isso `this.sessao()` funciona em `cabecalhos`).

Vamos método por método.

#### `sessao()`

```js
sessao() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
},
```

Passo a passo:

1. `sessionStorage.getItem(CHAVE_SESSAO)` → pega o **texto** guardado (ou `null` se não tem nada).
2. `JSON.parse(...)` → converte o texto em objeto. *(Curiosidade: `JSON.parse(null)` devolve `null`, sem erro.)*
3. `try { } catch { }` → **se o texto estiver corrompido** (alguém mexeu no DevTools, por exemplo), `JSON.parse` lança erro; o `catch` captura e devolve `null`, em vez de **quebrar a página inteira**.

Resultado: **ou devolve a sessão (objeto), ou `null`** (= "não está logado").

#### `cabecalhos()`

```js
cabecalhos() {
  const sessao = this.sessao();
  return sessao ? { Authorization: `Bearer ${sessao.token}` } : {};
},
```

Devolve o **cabeçalho HTTP** que prova quem você é. O formato `Bearer <token>` é o padrão pra JWT. Se não tem sessão, devolve `{}` (objeto vazio).

Isso conversa com o `requisitar`:

```js
headers: { 'Content-Type': 'application/json', ...Autenticacao.cabecalhos() },
```

O spread `...` "despeja" o `Authorization` junto. Se vier `{}`, não despeja nada e nada quebra. 👌

> **O que é JWT/token?** É como uma **pulseira de festa**. Você mostra o documento uma vez (login) e ganha a pulseira (token). Dali em diante, em vez de mostrar o documento toda hora, só mostra a pulseira, e o servidor confere se é válida.

#### `entrar(email, senha)`

```js
async entrar(email, senha) {
  let sessao;
  if (USAR_DADOS_FALSOS) {
    if (email !== USUARIO_TESTE.email || senha !== USUARIO_TESTE.senha) throw new Error('E-mail ou senha incorretos.');
    sessao = { token: 'token-de-teste', usuario: USUARIO_TESTE.usuario };
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
```

Dois caminhos que **terminam na mesma coisa**: uma variável `sessao` no formato `{ token, usuario }`.

- **Modo teste:** compara com o usuário fixo. Errou? `throw new Error(...)` (lança um erro). Acertou? Monta uma sessão com token fajuto.
- **Modo real:** manda `POST /auth/login` com e-mail e senha em JSON.
  - `{ email, senha }` é o atalho de propriedade (2.5): o mesmo que `{ email: email, senha: senha }`.
  - O `.catch(() => { throw ... })` **traduz um erro técnico** ("Failed to fetch") **numa mensagem amigável**. Lembra que `fetch` só falha se o servidor está fora do ar? É exatamente esse caso.
  - `401` = senha errada. Outro status ruim (`!resposta.ok`) = erro genérico.
  - Deu certo? `await resposta.json()` lê a resposta `{ token, usuario }`.
- **No final**, grava no `sessionStorage` (como texto, via `JSON.stringify`).

**Por que `throw` e não `return false`?** Porque quem chamou (a tela de login) usa `try/catch` e **mostra `erro.message` pro usuário**. A mensagem viaja junto com o erro. Código limpo: a função só se preocupa em "entrar ou falhar", e quem chama decide como mostrar.

**Por que `sessionStorage` e não `localStorage`?** O `sessionStorage` **some quando você fecha a aba**. Pra um sistema de gestão (onde mais de uma pessoa pode usar o mesmo computador), é mais seguro do que ficar logado pra sempre. A contrapartida: **cada aba tem a sua própria sessão**; abrir o sistema numa aba nova (digitando o endereço) pede login de novo.

#### `sair()`

```js
sair() {
  sessionStorage.removeItem(CHAVE_SESSAO);
  location.href = 'login.html';
},
```

Apaga a sessão e **redireciona** pro login. `location.href = '...'` navega pra outra página (como se você tivesse clicado num link).

> ⚠️ Esse `'login.html'` é um **caminho relativo** e tem um problema nas telas dentro de `templates/`. Detalhe na [seção 13](#13--bugs-e-melhorias-que-encontrei-lendo-o-código).

#### `exigirLogin()`

```js
exigirLogin() {
  if (!this.sessao()) location.replace('login.html');
},
```

Se **não** tem sessão, manda pro login. A diferença pra `href`: `location.replace` **troca** a página atual no histórico em vez de adicionar uma nova. Resultado: se o usuário apertar "Voltar", **não cai num loop** (voltar → página protegida → login → voltar...).

### 4.5 A tela de login: `iniciarTelaLogin()`

```js
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
```

Linha por linha:

1. **Já está logado?** Nem mostra o login, manda pro início. (`return` encerra a função aqui.)
2. Pega os elementos da tela pelos `id`.
3. `hidden = !USAR_DADOS_FALSOS` → a dica "Usuário de teste: admin@..." **só aparece no modo teste**. Quando for pra produção, ela some sozinha, sem você editar o HTML. 👏
4. Escuta o `submit` do formulário.
5. `evento.preventDefault()` → **impede o navegador de enviar o formulário do jeito antigo** (que recarregaria a página). Queremos controlar tudo via JS.
6. Limpa a mensagem de erro anterior e **desativa o botão** (evita clicar 2 vezes e mandar 2 logins).
7. `try`: tenta entrar. `.trim()` remove espaços acidentais antes/depois do e-mail. Sucesso → vai pro início.
8. `catch (erro)`: mostra `erro.message` (a mensagem que o `entrar` lançou) e **reativa o botão**.

`formulario.elements.email` → acessa o campo que tem `name="email"` direto pelo nome. (Por isso o HTML tem `name="email"` e `name="senha"`.)

### 4.6 As duas últimas linhas: o "porteiro"

```js
if (document.getElementById('formularioLogin')) iniciarTelaLogin();
else if (!document.body.hasAttribute('data-publica')) Autenticacao.exigirLogin();
```

Esse arquivo é carregado **em todas as páginas**. Então ele precisa descobrir sozinho **em que página está**:

| Situação | O que acontece |
|---|---|
| A página tem o formulário de login | Inicia a tela de login |
| Não tem, **e** o `<body>` **não** tem o atributo `data-publica` | É uma página protegida → `exigirLogin()` |
| Não tem formulário, **mas** o `<body>` tem `data-publica` | Página pública, não faz nada |

É por isso que o `login.html` tem `<body data-publica>`. **Padrão "protegido por padrão"**: toda página nova que você criar **já nasce protegida**. Pra deixar uma pública, você precisa **escolher** marcar. É a forma segura: esquecer de marcar = ficar trancado, nunca = ficar aberto.

### 4.7 ⚠️ O que esse login NÃO é

> **Isso não é segurança de verdade.** Qualquer pessoa pode abrir o DevTools (F12) e escrever na mão um objeto no `sessionStorage`. A proteção do front serve só pra **experiência** (não mostrar telas pra quem não logou).
> A segurança real vem do **back-end**: ele confere o token em **toda** requisição e responde `401` se for inválido. Seu `requisitar` já trata isso: recebeu `401` → `Autenticacao.sair()`.

---

## 5. `dados-exemplo.js` — o banco de mentirinha

### 5.1 Pra que serve

Gera dados fictícios no `localStorage` pra você ver **tabelas e gráficos cheios** sem ter back-end. Uma técnica chamada **seed** (semear).

### 5.2 A trava: só semeia uma vez

```js
if (localStorage.getItem('arecologico_servicos-realizados')) return;
```

Se já existe dados, **sai da função**. Sem isso, **toda vez que você abrisse uma página**, os dados seriam apagados e recriados, e as coisas que você cadastrou à mão sumiriam. Uma função assim, que pode rodar várias vezes sem estragar nada, se chama **idempotente**.

> 💡 Se quiser "resetar" os dados de teste: F12 → Application → Local Storage → apague as chaves `arecologico_*` e recarregue.

### 5.3 Funções ajudantes (todas dentro da função principal)

```js
const escolher = (lista, i) => lista[i % lista.length];
const dia = (diasAtras) => new Date(Date.now() - diasAtras * 864e5).toLocaleDateString('sv-SE');
const gravar = (recurso, lista) => localStorage.setItem(`arecologico_${recurso}`, JSON.stringify(lista));
const numerar = (lista) => lista.map((item, i) => ({ id: i + 1, ...item }));
```

**`escolher(lista, i)`**: escolhe um item **de forma circular** usando o operador `%` (resto da divisão).

```
escolher(['A','B','C'], 0)  → 'A'     (0 % 3 = 0)
escolher(['A','B','C'], 1)  → 'B'     (1 % 3 = 1)
escolher(['A','B','C'], 3)  → 'A'     (3 % 3 = 0)  ← deu a volta
escolher(['A','B','C'], 4)  → 'B'
```

Assim você distribui valores variados **sem usar aleatoriedade** (os dados são os mesmos toda vez, o que facilita testar).

**`dia(diasAtras)`**: devolve uma data em `yyyy-MM-dd`.

- `Date.now()` = milissegundos desde 1970.
- `864e5` = `86400000` = milissegundos em **1 dia** (`24 × 60 × 60 × 1000`). Notação científica (`864 × 10⁵`).
- `.toLocaleDateString('sv-SE')` → o **truque do locale sueco**: a Suécia formata datas como `2026-11-14`, que é exatamente o formato ISO. Uma gambiarra bem conhecida e muito útil.
- **Número negativo = futuro**: `dia(-10)` = daqui a 10 dias.

**`gravar(recurso, lista)`**: guarda a lista no `localStorage` com a chave `arecologico_clientes`, `arecologico_contratos`... **A mesma chave que o `script.js` usa** (`chaveLocal`). Os dois arquivos precisam concordar no nome. 🤝

**`numerar(lista)`**: dá um `id` a cada item (1, 2, 3...). O `{ id: i + 1, ...item }` coloca o `id` primeiro e copia o resto.

### 5.4 Cada conjunto de dados

**Clientes** (8):
```js
gravar('clientes', numerar(nomes.map((nome, i) => ({
  nome, tipoCliente: i % 2 ? 'JURIDICA' : 'FISICA', telefone: `(17) 99100-00${10 + i}`, cidade: escolher(cidades, i * 3 + 1),
}))));
```
Lendo de **dentro pra fora**: pega a lista de `nomes` → `.map` transforma cada nome num objeto cliente → `numerar` põe os ids → `gravar` salva. `i % 2 ? 'JURIDICA' : 'FISICA'` alterna (`0` é falso → FISICA, `1` é verdadeiro → JURIDICA).

**Contratos** (um por cliente): repare nas datas de fim:
```js
dataFim: dia(i < 3 ? -(10 + i * 8) : -(120 + i * 30)),
```
Os **3 primeiros** terminam em 10, 18 e 26 dias (**futuro**, por causa do negativo). Os outros terminam daqui a 120+ dias. Resultado: o painel "Contratos vencendo em 30 dias" **sempre mostra exatamente 3**. Os dados foram desenhados pra demonstrar essa funcionalidade.

**Ordens de serviço** (36), as mais elaboradas:

```js
const statusPonderado = ['CONCLUIDA', 'CONCLUIDA', 'CONCLUIDA', 'EM_ANDAMENTO', 'ABERTA', 'CANCELADA'];
```
O truque do **status ponderado**: `CONCLUIDA` aparece 3 vezes numa lista de 6, então ~50% das OS ficam concluídas (mais realista do que 25% cada status).

```js
...(status === 'CONCLUIDA' ? { dataExecucao: dia(diasAtras - 2) } : {}),
```
O **spread condicional**: se concluída, "despeja" `{ dataExecucao: ... }` no objeto; senão despeja `{}` (nada). Só OS concluídas têm data de execução. 

```js
valor: 180 + ((i * 97) % 14) * 60,
```
Gera valores variados mas previsíveis (180, 240, 300... até 960) sem `Math.random()`.

**`servicos-realizados`** (60): é a ligação entre **OS** e **serviço** (qual serviço foi feito em qual OS, quantidade, valor e desconto). **Não tem tela de cadastro**; só o dashboard lê esses dados (pro gráfico "Faturamento líquido por serviço").

### 5.5 Como o `script.js` chama isso

```js
if (USAR_DADOS_FALSOS && typeof semearDadosDeExemplo === 'function') semearDadosDeExemplo();
```

O `typeof semearDadosDeExemplo === 'function'` é uma **checagem defensiva**: "só chama **se essa função existir**". O comentário no topo do `dados-exemplo.js` diz "ao integrar, apague este arquivo". Graças a essa checagem, **apagar o arquivo não quebra nada**. (Sem ela, daria `ReferenceError`.) Mas lembre de apagar também a tag `<script>` nas páginas pra não gerar um 404 no console.

---

## 6. `script.js` — o coração do sistema

Esse é o arquivo mais importante. Ele tem **~460 linhas** e está dividido em blocos (marcados por comentários `// ---------- ... ----------`):

| Bloco | Linhas (aprox.) | Responsabilidade |
|---|---|---|
| Configuração das entidades | 7–90 | **Descreve** cada cadastro (clientes, contratos...) |
| Acesso a dados | 92–131 | `requisitar` + `Repositorio` (fala com servidor **ou** localStorage) |
| Menu lateral | 133–148 | Monta o menu |
| Formatação | 150–179 | Dinheiro, data, textos, rótulos |
| Construção da tela de CRUD | 181–305 | **Gera** tabela + formulário + busca a partir da descrição |
| Dashboard | 307–452 | Cartões e gráficos |
| Inicialização | 454–458 | Liga tudo |

---

### 6.1 `ENTIDADES`: a ideia mais importante do projeto

#### O problema

Você tem **6 cadastros** (clientes, funcionários, contratos, equipamentos, OS, serviços). Cada um precisa de: tabela, busca, botão Novo, formulário, Editar, Excluir. Escrever isso 6 vezes à mão seria **~1.500 linhas repetidas**, e consertar um bug exigiria consertar nos 6 lugares.

#### A solução: descrever em vez de programar

Em vez de escrever 6 telas, você escreve **1 tela genérica** (`iniciarTelaCrud`) e **6 descrições** (`ENTIDADES`). A tela genérica lê a descrição e se monta sozinha. Esse padrão se chama ***data-driven*** (dirigido por dados) ou *configuration-driven*.

> 🏭 **Analogia:** em vez de ter 6 máquinas diferentes, uma pra cada produto, você tem **1 máquina** e **6 receitas**. Pra fazer um produto novo, escreve uma receita nova; a máquina não muda.

#### O ajudante `campo()`

```js
const campo = (nome, rotulo, tipo = 'text', extras = {}) => ({ nome, rotulo, tipo, ...extras });
```

É uma **fábrica** de descrições de campo. Quando você escreve:

```js
campo('cpf', 'CPF', 'text', { somenteSe: ['tipoCliente', 'FISICA'] })
```

ela devolve:

```js
{ nome: 'cpf', rotulo: 'CPF', tipo: 'text', somenteSe: ['tipoCliente', 'FISICA'] }
```

Sem essa função, você escreveria o objeto inteiro à mão cada vez (mais comprido, mais chance de errar a grafia de `rotulo`). Com ela, cada campo cabe em **uma linha**. (Aqui o `...extras` junta as opções extras — 2.5.)

#### Anatomia de uma entidade

```js
clientes: {
  titulo: 'Clientes', recurso: 'clientes', campoRotulo: 'nome',
  colunas: ['nome', 'tipoCliente', 'telefone', 'cidade'],
  campos: [
    campo('tipoCliente', 'Tipo de cliente', 'select', { opcoes: ['FISICA', 'JURIDICA'], obrigatorio: true }),
    campo('nome', 'Nome / Razão social', 'text', { obrigatorio: true }),
    campo('cpf', 'CPF', 'text', { somenteSe: ['tipoCliente', 'FISICA'] }),
    ...
  ],
},
```

| Propriedade | Pra que serve |
|---|---|
| `titulo` | Texto do `<h2>` e nome nos relatórios |
| `recurso` | Duas funções: **parte da URL** (`/clientes`) e **nome da chave** no localStorage (`arecologico_clientes`) |
| `campoRotulo` | **Qual campo mostrar quando OUTRA entidade aponta pra esta.** Ex.: num contrato, `clienteId: 3` vira "Maria Souza" porque o `campoRotulo` de clientes é `'nome'` |
| `colunas` | Quais campos aparecem **na tabela** (pode ser menos que os do formulário) |
| `campos` | Todos os campos do **formulário** |

E as opções dentro de cada `campo(...)`:

| Opção | Efeito |
|---|---|
| `tipo` | `'text'`, `'number'`, `'date'`, `'email'`, `'select'` (lista de escolha), `'textarea'` (texto grande) |
| `opcoes: [...]` | Lista **fixa** pro `select` (ex.: `['PIX', 'DINHEIRO', ...]`) |
| `origem: 'clientes'` | O `select` é preenchido com **registros de outra entidade** (é a **chave estrangeira** do banco!) |
| `obrigatorio: true` | Vira o atributo `required` do HTML |
| `moeda: true` | Mostra formatado como R$ |
| `somenteSe: ['tipoCliente','FISICA']` | Campo **condicional**: só aparece quando `tipoCliente` for `FISICA` |

#### Reflexo do banco de dados (DER)

Repare como **cada entidade é uma tabela** e cada `origem` é uma **chave estrangeira**:

```js
contratos:     campo('clienteId',  'Cliente',  'select', { origem: 'clientes' })     // contrato → cliente
equipamentos:  campo('contratoId', 'Contrato', 'select', { origem: 'contratos' })    // equipamento → contrato
ordensServico: campo('contratoId', ...{ origem: 'contratos' }) + campo('funcionarioId', ...{ origem: 'funcionarios' })
```

#### Por que o nome da chave é `ordensServico` mas o `recurso` é `'ordens-servico'`?

São **dois nomes pra dois mundos**:
- `ordensServico` é uma **chave de objeto JS**. Hífen não é permitido sem aspas (`ordens-servico` seria lido como `ordens` menos `servico`).
- `'ordens-servico'` é a **URL**. Em URLs a convenção é minúsculas com hífen (*kebab-case*).

#### Por que essa estrutura é a melhor aqui?

✅ **Adicionar um campo = 1 linha.** Quer um campo "Bairro" em clientes? Uma linha em `campos` e **tabela, formulário e relatório PDF já funcionam**.
✅ **Adicionar uma tela nova = 1 bloco + 1 `<section>`.** Sem escrever lógica.
✅ **Comportamento 100% consistente.** Todos os cadastros se comportam igual, porque são o **mesmo código**.
✅ **Reaproveitamento:** o `relatorios.js` **reutiliza `ENTIDADES`** pra montar os relatórios (seção 8). Uma descrição serve a 2 funcionalidades.

⚖️ **Preço a pagar:** é mais **abstrato** de ler no começo (você precisa entender a "máquina" pra entender as "receitas"), e telas muito fora do padrão (dashboard, login) não cabem nesse molde. Por isso elas são escritas à mão.

---

### 6.2 `requisitar`: o garçom que vai ao servidor

```js
async function requisitar(caminho, metodo = 'GET', corpo) {
  const resposta = await fetch(URL_API + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...Autenticacao.cabecalhos() },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (resposta.status === 401) Autenticacao.sair();
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} em ${metodo} ${caminho}`);
  return resposta.status === 204 ? null : resposta.json();
}
```

**Parâmetros:** `caminho` (ex.: `'/clientes/5'`), `metodo` (padrão `'GET'`), `corpo` (opcional: os dados a enviar).

Linha por linha:

1. `await fetch(URL_API + caminho, {...})` → monta a URL completa (`http://localhost:8080/api` + `/clientes/5`) e faz a requisição.
2. `method: metodo` → GET/POST/PUT/DELETE.
3. `headers` → "estou mandando JSON" + o token de login (se tiver).
4. `body: corpo ? JSON.stringify(corpo) : undefined` → **se tem corpo**, converte pra texto JSON; **se não tem** (GET, DELETE), manda `undefined` (nada). Um GET com corpo daria problema.
5. `if (resposta.status === 401) Autenticacao.sair();` → **qualquer** tela, **qualquer** chamada: se o servidor disser "você não está autenticado" (token vencido, por exemplo), o usuário vai pro login. Em **um lugar só**, protege o sistema todo.
6. `if (!resposta.ok) throw new Error(...)` → `ok` é `true` pra status 200–299. Qualquer outro (400, 404, 409, 500) vira um **erro** com mensagem útil (`Erro 409 em DELETE /clientes/3`). *Lembra da pegadinha do `fetch`?* É por isso que essa verificação existe.
7. `resposta.status === 204 ? null : resposta.json()` → **204 = "No Content"** (deu certo mas não tem corpo; é o que o DELETE devolve). Chamar `.json()` numa resposta vazia **daria erro**. Então, nesse caso, devolve `null`.

**Por que existir uma função só pra isso?** Porque os 3 itens "chatos" (token, 401, checagem de erro) ficam **num lugar só**. Se você precisar mudar algo (ex.: mostrar uma mensagem de erro na tela), muda **aqui** e vale pra todo o sistema.

---

### 6.3 `Repositorio`: o "bibliotecário" que esconde de onde vêm os dados

#### As funções de apoio ao localStorage

```js
const chaveLocal = (recurso) => `arecologico_${recurso}`;
const lerLocal = (recurso) => JSON.parse(localStorage.getItem(chaveLocal(recurso)) || '[]');
const gravarLocal = (recurso, lista) => localStorage.setItem(chaveLocal(recurso), JSON.stringify(lista));
```

- `chaveLocal('clientes')` → `'arecologico_clientes'`.
- `lerLocal`: `localStorage.getItem(...)` devolve `null` se nunca foi gravado. O `|| '[]'` troca esse `null` por **o texto `"[]"`**, e `JSON.parse('[]')` dá uma **lista vazia**. Resultado: **nunca** devolve `null`, sempre uma lista. As telas não precisam checar.

#### O objeto

```js
const Repositorio = {
  async listar(recurso) {
    return USAR_DADOS_FALSOS ? lerLocal(recurso) : requisitar(`/${recurso}`);
  },

  async salvar(recurso, registro) {
    if (!USAR_DADOS_FALSOS) {
      return registro.id
        ? requisitar(`/${recurso}/${registro.id}`, 'PUT', registro)
        : requisitar(`/${recurso}`, 'POST', registro);
    }
    const lista = lerLocal(recurso);
    if (registro.id) {
      gravarLocal(recurso, lista.map((item) => (item.id === registro.id ? registro : item)));
    } else {
      gravarLocal(recurso, [...lista, { ...registro, id: Date.now() }]);
    }
  },

  async excluir(recurso, id) {
    if (!USAR_DADOS_FALSOS) return requisitar(`/${recurso}/${id}`, 'DELETE');
    gravarLocal(recurso, lerLocal(recurso).filter((item) => item.id !== id));
  },
};
```

#### O conceito: *Repository Pattern*

O resto do sistema **só fala com o `Repositorio`**. Ninguém mais sabe se os dados vêm do servidor ou do navegador. É como pedir um livro ao bibliotecário: você não sabe (nem precisa saber) em qual prateleira ele estava.

```
Tela de Clientes ──►  Repositorio.listar('clientes')  ──┬──►  modo teste:  localStorage
Tela de Contratos ─►  Repositorio.salvar(...)           │
Dashboard ─────────►  Repositorio.excluir(...)          └──►  modo real:   fetch → Spring Boot
```

**Por que isso é bom?** Quando o back-end ficar pronto, **o único código que muda é o interior do Repositorio** (e nem isso: ele já está pronto pros dois modos). As 6 telas, o dashboard e os relatórios **não mudam uma linha**. É o ponto que o comentário do arquivo chama de *"único ponto que o back-end precisa atender"*.

#### Por que tudo é `async`, até o que é síncrono?

O ramo do `localStorage` é instantâneo (não precisaria de `async`). Mas o ramo do servidor **precisa** (é demorado). Se um fosse `async` e o outro não, **quem chama teria que tratar os dois jeitos**. Deixando **ambos** `async`, quem chama sempre usa `await` e **nunca precisa saber** qual modo está ativo. As duas "versões" têm a **mesma cara** (mesma interface).

#### `listar`

Operador ternário: `condição ? seVerdade : seFalso`. Modo teste → lê local; senão → `GET /clientes`.

#### `salvar`: criar **ou** editar?

A regra é simples: **tem `id`? é edição. Não tem? é criação.**

| Situação | Modo real | Modo teste |
|---|---|---|
| Registro **com** `id` | `PUT /clientes/5` | `.map` troca o item que tem aquele id pelo novo |
| Registro **sem** `id` | `POST /clientes` | adiciona no final com `id: Date.now()` |

No modo teste, o `.map(item => item.id === registro.id ? registro : item)` percorre a lista e, **quando acha o item com o mesmo id**, devolve o novo no lugar; os outros passam iguais. É o jeito de "editar" numa lista **sem alterar a original**.

`Date.now()` como id: é o número de milissegundos desde 1970. Como você não consegue clicar "Salvar" duas vezes no mesmo milissegundo, **é praticamente único**. No modo real, **quem gera o `id` é o banco** (auto incremento).

#### O estilo "cláusula de guarda"

Repare em:
```js
if (!USAR_DADOS_FALSOS) {
  return ...;       // resolve o caso do servidor e SAI
}
// daqui pra baixo, só o caso do localStorage
```
Em vez de `if { ... } else { ... }` aninhado, resolve **um caso e sai** (*early return* / *guard clause*). Fica mais plano e fácil de ler. É uma recomendação do *Clean Code* (que você pediu).

#### `excluir`

Modo teste: `.filter(item => item.id !== id)` **mantém todos, menos o que tem aquele id**. (Em lista, "excluir" é "criar uma nova lista sem esse item".)

> ⚠️ **Detalhe sutil:** `item.id === registro.id` usa `===` (**igualdade estrita**), que **diferencia número de texto** (`5 === '5'` é `false`). Por isso o `lerFormulario` converte o id com `Number(...)`: os `data-*` e valores de formulário chegam sempre como **texto**.

---

### 6.4 O menu lateral

```js
const LINKS_MENU = [
  ['../index.html', 'Início'], ['../templates/Dashboard.html', 'Dashboard'], ['../templates/Cliente.html', 'Clientes'],
  ['../templates/Contrato.html', 'Contratos'], ['../templates/Servico.html', 'Serviços / OS'],
  ['../templates/Funcionario.html', 'Funcionários'], ['../templates/Relatorio.html', 'Relatórios'],
];

function montarMenu() {
  const paginaAtual = location.pathname.split('/').pop() || 'index.html';
  const links = LINKS_MENU.map(([arquivo, nome]) =>
    `<a href="${arquivo}" class="${arquivo === paginaAtual ? 'ativo' : ''}">${nome}</a>`).join('');
  const usuario = Autenticacao.sessao()?.usuario ?? {};
  document.getElementById('menu').innerHTML = `<h1 class="marca-logo" role="img" ... aria-label="AR Ecológico"></h1><div class="links">${links}</div>
    <div class="usuario">Olá, <strong>${usuario.nome ?? 'visitante'}</strong>
      <button type="button" class="secundario" data-sair>Sair</button></div>`;
  document.querySelector('[data-sair]').addEventListener('click', () => Autenticacao.sair());
}
```

**Por que o menu é feito no JS e não escrito em cada HTML?** Se o menu estivesse copiado nas 7 páginas, **adicionar uma página nova** = editar 7 arquivos. Do jeito atual, edita **uma lista** (`LINKS_MENU`) e todas as páginas atualizam. É o mesmo princípio DRY.

**Passo a passo:**

1. `location.pathname` é o caminho da URL atual (ex.: `/templates/Cliente.html`).
2. `.split('/')` quebra nos `/` → `['', 'templates', 'Cliente.html']`.
3. `.pop()` pega o **último** → `'Cliente.html'`.
4. `|| 'index.html'` → se estiver na raiz (`/`), o último pedaço é vazio, então usa `index.html`.
5. `LINKS_MENU.map(([arquivo, nome]) => ...)` → transforma cada par `[arquivo, nome]` num `<a>`. (Desestruturação na própria assinatura.)
6. `.join('')` cola todos num texto só.
7. `usuario.nome ?? 'visitante'` → mostra o nome ou "visitante".
8. Depois de colocar o HTML na página (`innerHTML`), **só então** dá pra achar o botão `[data-sair]` e escutar o clique. *(Se tentasse antes, o botão não existiria ainda.)*

**A logo:** o `<h1 class="marca-logo" role="img" aria-label="AR Ecológico">` não tem imagem dentro. O `style.css` faz um truque bacana:

```css
.marca-logo {
  aspect-ratio: 897 / 278;
  background-color: var(--verde);
  -webkit-mask: url("../img/logo.png") center / contain no-repeat;
  mask: url("../img/logo.png") center / contain no-repeat;
}
```

Uma **máscara** deixa o fundo colorido aparecer **só onde o PNG é opaco**. Como sua logo é **branca com fundo transparente**, o resultado é a logo **pintada com `var(--verde)`**. E como a cor de destaque muda no ⚙ (verde, azul, laranja, roxo), **a logo muda de cor junto**, de graça. O `role="img"` + `aria-label` dizem aos leitores de tela "isso é uma imagem chamada AR Ecológico".

> ⚠️ O `arquivo === paginaAtual` nunca é verdadeiro (compara `'../templates/Cliente.html'` com `'Cliente.html'`), então o item "ativo" do menu nunca fica destacado. Detalhe na [seção 13](#13--bugs-e-melhorias-que-encontrei-lendo-o-código).

---

### 6.5 Formatação

```js
const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarData = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');
const formatarOpcao = (texto) => texto.replace(/_/g, ' ').toLowerCase();
```

#### `formatarMoeda`

`1234.5` → `"R$ 1.234,50"`. O `toLocaleString` com `pt-BR` e `BRL` cuida de separador de milhar, vírgula decimal e símbolo. **Nunca monte isso à mão** (`'R$ ' + valor.toFixed(2).replace('.', ',')` esquece o ponto de milhar e quebra com números grandes). O `Number(valor)` garante que, se vier texto (`"350"`), funcione.

#### `formatarData` e o `T00:00:00` (pegadinha famosa!)

```js
new Date('2026-11-14')            // interpretado como UTC (meia-noite em Londres)
```
No Brasil (UTC−3), meia-noite em Londres é **21h do dia 13**. Resultado: a tela mostraria **13/11/2026** em vez de 14. 😱

```js
new Date('2026-11-14T00:00:00')   // SEM o "Z" no fim = horário LOCAL
```
Acrescentando `T00:00:00`, o JS interpreta como **meia-noite no seu fuso**, e a data sai certa. Essa linha **parece boba, mas evita um bug de verdade**.

#### `formatarOpcao`

Transforma `'EM_ANDAMENTO'` em `'em andamento'`. `/_/g` é uma **expressão regular**: `_` é o que procurar e `g` (*global*) significa "**todas** as ocorrências, não só a primeira".

#### `formatarCelula`: uma cadeia de decisões

```js
function formatarCelula(definicao, valor, rotulos) {
  if (valor === undefined || valor === null || valor === '') return '-';
  if (definicao.origem) return rotulos[definicao.nome].get(valor) ?? valor;
  if (definicao.moeda) return formatarMoeda(valor);
  if (definicao.tipo === 'date') return formatarData(valor);
  if (definicao.opcoes) return formatarOpcao(valor);
  return valor;
}
```

Recebe a **descrição do campo**, o **valor** e os **rótulos**. Decide o que mostrar:

| # | Se... | Mostra |
|---|---|---|
| 1 | Valor vazio | `-` |
| 2 | Campo aponta pra outra entidade | **O nome** (via mapa de rótulos). Se o registro apontado foi apagado, mostra o próprio id em vez de quebrar (`?? valor`) |
| 3 | É dinheiro | `R$ 350,00` |
| 4 | É data | `14/11/2026` |
| 5 | Tem lista de opções | `em andamento` |
| 6 | Qualquer outra coisa | O valor como está |

**A ordem importa:** o teste `origem` vem antes dos outros porque um campo com `origem` tem como valor um **id numérico** (ex.: `3`), que seria mostrado errado se caísse em outra regra.

#### `carregarRotulos`: transformando ids em nomes

Na tabela de contratos, o `clienteId` vale `3`. Ninguém quer ver "3", quer ver "Ana Ribeiro". Essa função monta o dicionário `id → nome`:

```js
async function carregarRotulos(entidade) {
  const rotulos = {};
  for (const definicao of entidade.campos.filter((c) => c.origem)) {
    const origem = ENTIDADES[definicao.origem];
    const lista = await Repositorio.listar(origem.recurso);
    rotulos[definicao.nome] = new Map(lista.map((item) => [item.id, item[origem.campoRotulo]]));
  }
  return rotulos;
}
```

Exemplo concreto pra entidade `contratos`:

1. `entidade.campos.filter(c => c.origem)` → só os campos que apontam pra outra entidade: `[clienteId]`.
2. `origem = ENTIDADES['clientes']`.
3. `lista` = todos os clientes.
4. `lista.map(item => [item.id, item.nome])` → `[[1,'Maria Souza'], [2,'Padaria Pão Dourado'], ...]`.
5. `new Map(...)` transforma esses pares num dicionário.
6. Guarda em `rotulos['clienteId']`.

Depois, `formatarCelula` faz `rotulos['clienteId'].get(3)` → `'João Almeida'`. 🎯 (Aqui o `campoRotulo: 'nome'` das clientes mostra a que veio.)

**Por que `Map` e não `.find()` em cada linha?** Com 500 contratos e 500 clientes, o `.find` olharia até 500 clientes **por linha** (250.000 comparações). O `Map` vai **direto** (500 buscas rápidas).

#### `celulaDaTabela`: tabela ≠ PDF

```js
function celulaDaTabela(definicao, valor, rotulos) {
  const texto = formatarCelula(definicao, valor, rotulos);
  return definicao.nome === 'status' && valor ? `<span class="selo selo-${valor}">${texto}</span>` : texto;
}
```

Na **tela**, o status vira uma **etiqueta colorida** (`<span class="selo selo-CONCLUIDA">`; o CSS define a cor de cada `selo-*`). No **PDF** não dá pra usar HTML, então o relatório chama `formatarCelula` direto (texto puro). Por isso são **duas funções**: uma gera **texto**, a outra **HTML**. É a **separação de responsabilidades**: `formatarCelula` serve a todos; `celulaDaTabela` só acrescenta o enfeite da tela.

---

### 6.6 A tela de CRUD: construindo tudo a partir da descrição

Essa é a "máquina" que lê as "receitas" (`ENTIDADES`). São 3 funções: `criarHtmlDoCampo`, `criarEsqueleto` e `iniciarTelaCrud`.

#### `criarHtmlDoCampo(definicao)`: gera UM campo do formulário

```js
function criarHtmlDoCampo(definicao) {
  const condicao = definicao.somenteSe ? `data-se-campo="${definicao.somenteSe[0]}" data-se-valor="${definicao.somenteSe[1]}"` : '';
  const obrigatorio = definicao.obrigatorio ? 'required' : '';
  const classe = definicao.tipo === 'textarea' ? 'linha-inteira' : '';
  const entrada = definicao.tipo === 'select'
    ? `<select name="${definicao.nome}" ${obrigatorio}></select>`
    : definicao.tipo === 'textarea'
      ? `<textarea name="${definicao.nome}" rows="2" ${obrigatorio}></textarea>`
      : `<input name="${definicao.nome}" type="${definicao.tipo}" ${definicao.tipo === 'number' ? 'step="any"' : ''} ${obrigatorio}>`;
  return `<label class="${classe}" ${condicao}>${definicao.rotulo}${entrada}</label>`;
}
```

Ela constrói o HTML em **pedaços**, depois junta:

| Variável | Valor | Efeito |
|---|---|---|
| `condicao` | `data-se-campo="tipoCliente" data-se-valor="FISICA"` (ou vazio) | Etiquetas pro JS saber que esse campo é **condicional** |
| `obrigatorio` | `required` (ou vazio) | O **navegador mesmo** bloqueia o envio se estiver vazio e mostra "preencha este campo", **sem você escrever validação** |
| `classe` | `linha-inteira` pra textarea | O CSS faz o campo ocupar a **linha toda** do formulário |
| `entrada` | `<select>`, `<textarea>` ou `<input>` | O elemento certo conforme o `tipo` |

**O ternário aninhado** (`a ? x : b ? y : z`) lê-se como "se for select... senão, se for textarea... senão, input".

Detalhes que valem ouro:

- **`step="any"` nos números:** por padrão, `<input type="number">` só aceita **inteiros** (passo 1). Sem isso, digitar `350,50` num valor daria erro de validação. `step="any"` libera decimais.
- **O `<label>` envolve o campo** (o campo está **dentro** do label). Assim, clicar no texto "Cidade" **foca** no campo, e leitores de tela associam os dois, **sem precisar de `for`/`id`**. Acessibilidade de graça.
- `name="${definicao.nome}"` é essencial: depois o JS acessa o campo por `formulario.elements['cpf']`.
- Para o `select`, o HTML sai **vazio** (`<select ...></select>`). As opções são colocadas depois, por `preencherSelects` (porque podem depender de dados do servidor, que demoram).

#### `criarEsqueleto(secao, entidade)`: monta a seção inteira

```js
function criarEsqueleto(secao, entidade) {
  secao.classList.add('secao');
  secao.innerHTML = `
    <h2>${entidade.titulo}</h2>
    <div class="barra-ferramentas">
      <input type="search" placeholder="Buscar..." data-busca>
      <button type="button" data-novo>+ Novo</button>
    </div>
    <div class="tabela-rolagem"><table><thead></thead><tbody></tbody></table></div>
    <dialog><form class="formulario" method="dialog">
      <input type="hidden" name="id">
      ${entidade.campos.map(criarHtmlDoCampo).join('')}
      <div class="rodape">
        <button type="button" class="secundario" data-cancelar>Cancelar</button>
        <button type="submit">Salvar</button>
      </div>
    </form></dialog>`;
}
```

Ela preenche a `<section>` vazia da página com:

1. Título.
2. Barra com **busca** e botão **+ Novo**.
3. Tabela (cabeçalho e corpo vazios, preenchidos depois).
4. Um `<dialog>` (a janelinha do formulário).

Pontos importantes:

- **`${entidade.campos.map(criarHtmlDoCampo).join('')}`** → passa a lista de campos pelo `criarHtmlDoCampo`, um a um. (Escrever `.map(criarHtmlDoCampo)` sem parênteses é passar **a própria função** pra o `map` chamar em cada item.)
- **`<dialog>`** é um elemento **nativo** do HTML pra janelas modais. Ele já traz de graça: fundo escurecido, bloqueio dos cliques atrás, **tecla ESC fecha**, foco preso na janela. Antes isso exigia bibliotecas. Abre com `.showModal()` e fecha com `.close()`.
- **`method="dialog"` no formulário:** é um truque do HTML. Quando um formulário **dentro de um dialog** é enviado com `method="dialog"`, **o navegador só fecha a janela**, sem recarregar a página nem navegar. Por isso, no `submit` não tem `preventDefault`.
- **`<input type="hidden" name="id">`**: campo **invisível** que guarda o `id` quando você está **editando** (vazio = criando). É assim que o `lerFormulario` decide entre `POST` e `PUT`.
- **`type="button"` nos botões Novo/Cancelar:** dentro de um formulário, um `<button>` sem tipo **envia o formulário**. Marcar `type="button"` diz "isso só clica, não envia".
- **Atributos `data-busca`, `data-novo`, `data-cancelar`:** são as **alças** pra o JS achar cada elemento (lembra do 2.14?). O CSS usa classes; o JS usa `data-*`.

#### `iniciarTelaCrud(secao)`: a lógica inteira

##### Preparação

```js
function iniciarTelaCrud(secao) {
  const entidade = ENTIDADES[secao.dataset.entidade];
  criarEsqueleto(secao, entidade);

  const corpoTabela = secao.querySelector('tbody');
  const caixaBusca = secao.querySelector('[data-busca]');
  const janela = secao.querySelector('dialog');
  const formulario = secao.querySelector('form');
  const colunas = entidade.colunas.map((nome) => entidade.campos.find((c) => c.nome === nome));

  secao.querySelector('thead').innerHTML =
    `<tr>${colunas.map((c) => `<th>${c.rotulo}</th>`).join('')}<th>Ações</th></tr>`;
```

- `secao.dataset.entidade` lê `data-entidade="clientes"` e **busca a receita** em `ENTIDADES`.
- **Todas as buscas usam `secao.querySelector`** (e não `document.querySelector`). Isso é fundamental: a página `Contrato.html` tem **duas seções** (contratos e equipamentos). Cada uma procura **só dentro de si mesma**, então o `<dialog>` dos contratos não se mistura com o dos equipamentos.
- `colunas`: `entidade.colunas` é uma lista de **nomes** (`['nome', 'tipoCliente', ...]`). Esse `.map` + `.find` converte cada nome na **descrição completa** do campo (pra ter acesso ao `rotulo`, `moeda` etc.).
- Monta o `<thead>` com um `<th>` por coluna + a coluna "Ações".

> 🧠 **Conceito: *closure* (fechamento).** Dentro de `iniciarTelaCrud` você declara `entidade`, `corpoTabela`, `janela`... e depois funções internas (`atualizarTabela`, `abrirFormulario`...) que **usam essas variáveis**. Mesmo depois de `iniciarTelaCrud` terminar, essas funções internas **continuam "lembrando"** das variáveis. Cada chamada cria seu **próprio conjunto** delas. Por isso duas seções na mesma página não se atrapalham: cada uma tem a sua cópia privada de `entidade`, `janela` etc.

##### `atualizarTabela`: desenha as linhas

```js
async function atualizarTabela() {
  const [registros, rotulos] = await Promise.all([Repositorio.listar(entidade.recurso), carregarRotulos(entidade)]);
  const termo = caixaBusca.value.toLowerCase();
  const filtrados = registros.filter((r) => JSON.stringify(Object.values(r)).toLowerCase().includes(termo));

  corpoTabela.innerHTML = filtrados.length
    ? filtrados.map((registro) => `
      <tr>${colunas.map((c) => `<td data-rotulo="${c.rotulo}">${celulaDaTabela(c, registro[c.nome], rotulos)}</td>`).join('')}
        <td class="acoes">
          <button class="secundario" data-editar="${registro.id}">Editar</button>
          <button class="perigo" data-excluir="${registro.id}">Excluir</button>
        </td></tr>`).join('')
    : `<tr><td class="vazio" colspan="${colunas.length + 1}">Nenhum registro encontrado.</td></tr>`;
}
```

1. **`Promise.all`** busca os registros **e** os rótulos (id→nome) **ao mesmo tempo**.
2. **Busca:** pega o texto digitado e filtra. O truque:
   - `Object.values(r)` → todos os valores do registro: `['Maria', 'FISICA', '(17) 99100...']`.
   - `JSON.stringify(...)` → vira um texto só: `'["Maria","FISICA","(17) 99100..."]'`.
   - `.toLowerCase().includes(termo)` → "esse textão contém o que a pessoa digitou?".
   
   É uma busca **"em qualquer campo"** feita em 1 linha, sem precisar saber quais campos existem. Uma gambiarra elegante.
   
   > ⚠️ **Limitação:** ela busca nos valores **brutos** (o `clienteId: 3`, não o nome "Ana"). Na tabela de contratos, buscar o nome do cliente **não acha**. Além disso, **cada tecla digitada dispara uma busca nova** (no modo real, uma requisição ao servidor por tecla). Veja a [seção 13](#13--bugs-e-melhorias-que-encontrei-lendo-o-código).

3. **Desenha o corpo:** se tem registros, `.map` cria uma `<tr>` por registro, com uma `<td>` por coluna (via `celulaDaTabela`) + a célula de ações. Senão, uma linha única "Nenhum registro encontrado" com `colspan` (= ocupa todas as colunas).
4. **`data-rotulo="${c.rotulo}"`** em cada `<td>`: no celular, o `style.css` usa `content: attr(data-rotulo)` pra mostrar o nome da coluna **dentro de cada célula** (a tabela vira "cartões"). O JS só deixa a etiqueta; o CSS decide como usar.
5. **`data-editar="${registro.id}"`** e **`data-excluir="..."`**: os botões carregam **o id do registro** nas próprias etiquetas.

**Estratégia: redesenhar tudo.** A cada atualização, `corpoTabela.innerHTML = ...` **joga fora todas as linhas e recria**. Alternativa mais sofisticada (que o React faz) seria alterar só o que mudou. Pra tabelas de centenas de linhas, "redesenhar tudo" é simples e rápido o bastante. **Escolha de simplicidade.**

##### `preencherSelects`: preenche as listas de escolha

```js
async function preencherSelects() {
  for (const definicao of entidade.campos.filter((c) => c.tipo === 'select')) {
    const select = formulario.elements[definicao.nome];
    const opcoes = definicao.origem
      ? (await Repositorio.listar(ENTIDADES[definicao.origem].recurso))
          .map((item) => [item.id, item[ENTIDADES[definicao.origem].campoRotulo]])
      : definicao.opcoes.map((opcao) => [opcao, formatarOpcao(opcao)]);
    select.innerHTML = '<option value="">Selecione...</option>' +
      opcoes.map(([valor, texto]) => `<option value="${valor}">${texto}</option>`).join('');
  }
}
```

Pra **cada campo do tipo `select`**:

- **Se tem `origem`** → busca os registros da outra entidade e cria pares `[id, nome]` (o `value` é o id, o texto visível é o nome). Cliente "Maria Souza" → `<option value="1">Maria Souza</option>`.
- **Senão** → usa a lista fixa `opcoes`: `['PIX', 'DINHEIRO']` vira `<option value="PIX">pix</option>` (o **valor enviado** continua `PIX`, só o **texto exibido** é amigável).
- Sempre começa com `<option value="">Selecione...</option>` (valor vazio). Combinado com `required`, o navegador **obriga** o usuário a escolher algo.

**Por que preencher de novo toda vez que abre o formulário?** Pra que um cliente **recém-cadastrado** já apareça no select de contratos. A lista está sempre **fresca**.

##### `atualizarCamposCondicionais`: o CPF só pra pessoa física

```js
function atualizarCamposCondicionais() {
  formulario.querySelectorAll('[data-se-campo]').forEach((rotulo) => {
    const visivel = formulario.elements[rotulo.dataset.seCampo].value === rotulo.dataset.seValor;
    rotulo.hidden = !visivel;
    rotulo.querySelector('input, select, textarea').disabled = !visivel;
  });
}
```

Pra cada `<label>` que tem `data-se-campo`:

1. Olha **o campo controlador** (`tipoCliente`) e compara o valor com o esperado (`FISICA`).
2. `rotulo.hidden = !visivel` → **esconde/mostra** o campo.
3. `...disabled = !visivel` → **desativa** o campo escondido. **Esse passo é crucial** por dois motivos:
   - Um campo `disabled` **não é validado** pelo navegador. (Se o CNPJ fosse `required` e estivesse escondido, o navegador bloquearia o envio por um campo que **o usuário nem vê**.)
   - O `lerFormulario` **ignora** campos `disabled`, então o **CPF não vai junto** quando o cliente é jurídico.

> **Nota de nomes:** `data-se-campo` vira `dataset.seCampo` no JS. O hífen some e a letra seguinte vira maiúscula (*camelCase*). Sempre assim.

##### `abrirFormulario`: abre pra criar ou editar

```js
async function abrirFormulario(registro = {}) {
  await preencherSelects();
  formulario.reset();
  formulario.elements.id.value = registro.id ?? '';
  entidade.campos.forEach((c) => { formulario.elements[c.nome].value = registro[c.nome] ?? ''; });
  atualizarCamposCondicionais();
  janela.showModal();
}
```

`registro = {}` (valor padrão): **sem argumento = formulário em branco (novo)**; **com um registro = preenchido (editar)**. Uma função serve aos dois usos.

**A ordem das linhas é proposital:**

1. `await preencherSelects()` → **primeiro** cria as opções. Se você tentasse definir `select.value = 3` **antes** de existir a `<option value="3">`, **não pegaria**.
2. `formulario.reset()` → limpa tudo.
3. Define o `id` (ou vazio).
4. Preenche cada campo. `registro[c.nome] ?? ''` → se o registro não tem esse campo, usa vazio (sem isso apareceria a palavra `undefined` no campo).
5. `atualizarCamposCondicionais()` → **depois** de preencher, já mostra/esconde o CPF/CNPJ certo.
6. `janela.showModal()` → só então abre.

##### `lerFormulario`: do formulário de volta pra um objeto

```js
function lerFormulario() {
  const registro = {};
  if (formulario.elements.id.value) registro.id = Number(formulario.elements.id.value);
  for (const c of entidade.campos) {
    const elemento = formulario.elements[c.nome];
    if (elemento.disabled || elemento.value === '') continue;
    registro[c.nome] = (c.tipo === 'number' || c.origem) ? Number(elemento.value) : elemento.value;
  }
  return registro;
}
```

- Só coloca o `id` se tiver (edição).
- Pra cada campo: **pula** (`continue`) se está desativado (escondido) ou vazio. Por isso campos opcionais não preenchidos **nem são enviados**, e o JSON fica limpo.
- **Conversão de tipos (importantíssimo):** **todo valor de formulário é TEXTO**, mesmo em `<input type="number">`. `"350"` ≠ `350`. O back-end espera **número** pra valores e chaves estrangeiras (`clienteId`, `valor`...), como diz o contrato. Então: campos `number` **e** campos com `origem` passam por `Number(...)`.

Exemplo do resultado pra um contrato:

```js
{ id: 4, clienteId: 2, descricao: 'Manutenção - Padaria', tipoContrato: 'PMOC', dataInicio: '2026-01-10' }
//        ↑ número                                          ↑ texto               ↑ texto ISO
```

> ⚠️ Como campos vazios são **omitidos**, se o usuário **apagar** um campo opcional ao editar, ele **não vai no PUT**. No modo teste isso apaga o campo (o registro inteiro é substituído). No modo real, depende de como o back-end trata campos ausentes. Combine isso com quem faz a API.

##### Os ouvintes de evento

```js
secao.querySelector('[data-novo]').addEventListener('click', () => abrirFormulario());
secao.querySelector('[data-cancelar]').addEventListener('click', () => janela.close());
caixaBusca.addEventListener('input', atualizarTabela);
formulario.addEventListener('change', atualizarCamposCondicionais);

formulario.addEventListener('submit', async () => {
  await Repositorio.salvar(entidade.recurso, lerFormulario());
  await atualizarTabela();
});
```

| Ouvinte | O que faz |
|---|---|
| Clicou **+ Novo** | Abre o formulário vazio. (Note o `() => abrirFormulario()`: se passasse `abrirFormulario` direto, o `click` mandaria o **objeto do evento** como `registro`!) |
| Clicou **Cancelar** | Fecha a janela |
| Digitou na **busca** | Redesenha a tabela com o filtro |
| Mudou **qualquer campo** do formulário | Reavalia os campos condicionais (ex.: trocou FISICA→JURIDICA) |
| **Salvou** | Lê o formulário → `Repositorio.salvar` → redesenha a tabela |

Repare no `submit`: **o navegador valida os `required` antes** de disparar esse evento. Se algo obrigatório estiver vazio, o `submit` nem acontece. E como o form é `method="dialog"`, **a janela fecha sozinha**.

##### Delegação de eventos: um ouvinte pra todos os botões

```js
corpoTabela.addEventListener('click', async (evento) => {
  const { editar, excluir } = evento.target.dataset;
  if (editar) {
    const registros = await Repositorio.listar(entidade.recurso);
    abrirFormulario(registros.find((r) => r.id === Number(editar)));
  }
  if (excluir && confirm('Deseja realmente excluir este registro?')) {
    await Repositorio.excluir(entidade.recurso, Number(excluir));
    await atualizarTabela();
  }
});
```

**O problema:** as linhas (e seus botões) são **destruídas e recriadas** a cada `atualizarTabela`. Se você colocasse um ouvinte em **cada botão**, perderia todos a cada redesenho.

**A solução, chamada *event delegation*:** coloca **um único ouvinte no `<tbody>`** (que **nunca é destruído**, só o conteúdo dele). Quando você clica em qualquer lugar, o evento **"sobe"** do botão até o `tbody` (*bubbling*), e o ouvinte descobre **qual elemento foi clicado** por `evento.target`.

**Como descobre se foi "Editar" ou "Excluir"?** Pelas etiquetas:

- Clicou no botão Editar do registro 7 → `evento.target.dataset` é `{ editar: '7' }` → `editar = '7'`, `excluir = undefined`.
- Clicou em outro lugar (uma `<td>`) → os dois ficam `undefined` e nada acontece.

**Editar:** busca a lista, acha o registro com `.find` (`Number(editar)` porque `'7'` é texto e o `id` é número) e abre o formulário preenchido.
**Excluir:** `confirm(...)` mostra o "OK/Cancelar" nativo. Só se confirmar, exclui e redesenha. O `&&` faz curto-circuito: se `excluir` for `undefined`, **nem chega a mostrar o `confirm`**.

##### A última linha

```js
  atualizarTabela();
}
```

Desenha a tabela pela primeira vez, assim que a tela é montada.

---

### 6.7 Dashboard: gráficos sem biblioteca nenhuma

O dashboard é **escrito à mão** (não é data-driven), porque cada gráfico é diferente. Mas ele também foi **organizado em pequenas funções reutilizáveis**.

#### 6.7.1 Ferramentas básicas

```js
const PALETA = ['#1b7f5c', '#1f6fb2', '#c2620f', '#7b4bb3', '#c0392b', '#6f7f7a'];
const COR_STATUS = { ABERTA: '#1f6fb2', EM_ANDAMENTO: '#c2620f', CONCLUIDA: '#1b7f5c', CANCELADA: '#6f7f7a' };

const dataEmDias = (dias) => new Date(Date.now() + dias * 864e5).toLocaleDateString('sv-SE');
const somar = (lista, chave) => lista.reduce((total, item) => total + (item[chave] || 0), 0);
const contarPor = (lista, chave) =>
  lista.reduce((contagem, item) => ({ ...contagem, [item[chave] ?? 'N/D']: (contagem[item[chave] ?? 'N/D'] || 0) + 1 }), {});
```

- **`PALETA` / `COR_STATUS`**: cores fixas; o status sempre tem a **mesma cor** nos gráficos e nas etiquetas.
- **`dataEmDias(30)`**: a data de daqui a 30 dias em `yyyy-MM-dd` (negativo = passado). É o espelho do `dia()` do `dados-exemplo.js`.
- **`somar(lista, chave)`**: soma o campo `chave` de todos os itens. `item[chave] || 0` protege contra campo ausente (`undefined + 5` daria `NaN`).

```js
somar([{ valor: 100 }, { valor: 250 }, {}], 'valor')   // 350
```

- **`contarPor(lista, chave)`**: **conta quantos itens há de cada valor**. É o famoso "group by + count":

```js
contarPor([{ status: 'ABERTA' }, { status: 'CONCLUIDA' }, { status: 'ABERTA' }], 'status')
// → { ABERTA: 2, CONCLUIDA: 1 }
```

Como o `reduce` constrói isso, passo a passo (cada volta recebe o objeto acumulado):

| Volta | Item | Acumulado antes | Acumulado depois |
|---|---|---|---|
| início | — | `{}` | |
| 1 | ABERTA | `{}` | `{ ABERTA: 1 }` |
| 2 | CONCLUIDA | `{ ABERTA: 1 }` | `{ ABERTA: 1, CONCLUIDA: 1 }` |
| 3 | ABERTA | `{ ABERTA: 1, CONCLUIDA: 1 }` | `{ ABERTA: 2, CONCLUIDA: 1 }` |

O `[item[chave] ?? 'N/D']` entre colchetes é uma **chave calculada**: o nome da propriedade vem de uma variável. E `?? 'N/D'` agrupa quem **não tem valor** numa categoria "N/D" (não disponível).

#### 6.7.2 `desenharBarras`: gráfico de barras só com `<div>`

```js
function desenharBarras(idElemento, contagem, { rotular = formatarOpcao, valor = String } = {}) {
  const itens = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maior = Math.max(1, ...itens.map(([, total]) => total));
  document.getElementById(idElemento).innerHTML = itens.map(([nome, total]) => `
    <div class="barra"><span class="nome">${rotular(String(nome))}</span>
      <div class="preenchimento" style="width:${(total / maior) * 60}%"></div><span>${valor(total)}</span></div>`).join('')
    || '<p class="vazio">Sem dados no período.</p>';
}
```

Recebe: **onde desenhar** (`id` do elemento), **os dados** (`{ nome: quantidade }`) e **opções** (como formatar o rótulo e o valor).

Passo a passo:

1. `Object.entries(contagem)` → `{ ABERTA: 2, CONCLUIDA: 5 }` vira `[['ABERTA', 2], ['CONCLUIDA', 5]]`.
2. `.sort((a, b) => b[1] - a[1])` → ordena do **maior pro menor** pela quantidade (posição `[1]`).
3. `.slice(0, 6)` → só os **6 primeiros** (o gráfico não vira uma lista infinita).
4. `maior` = o valor mais alto, usado como "100%" da escala. `Math.max(1, ...)`: o `1` garante que **nunca seja 0**, evitando **divisão por zero** quando tudo for zero. (Repare no `([, total])`: a vírgula vazia **pula** o primeiro item do par.)
5. Pra cada item, gera uma `<div class="barra">` com o nome, uma `<div>` cuja **largura em %** é `(total / maior) * 60`, e o valor. O maior ocupa 60% da linha, e os outros proporcionalmente. Os 40% restantes sobram pro nome e o número.
6. `|| '<p class="vazio">...'` → se a lista estiver vazia, `.join('')` dá texto vazio (que é **falso**), e o `||` usa a mensagem alternativa.

**O parâmetro de opções:** `{ rotular = formatarOpcao, valor = String } = {}` desestrutura **e** define padrões ao mesmo tempo:

- Sem opções: rótulo vira `formatarOpcao` (`'EM_ANDAMENTO'` → `'em andamento'`) e valor vira `String` (número em texto).
- No gráfico de faturamento por funcionário: `{ rotular: (nome) => nome, valor: formatarMoeda }` → nome **como está** (não minúscula) e valor em **R$**.
- O `= {}` final é pro caso de **nenhuma** opção ser passada (senão `undefined` não pode ser desestruturado).

Passar **funções como argumentos** (`valor: formatarMoeda`) é um conceito poderoso: **a mesma função de desenho** serve pra contagens, dinheiro, etc., e **quem chama escolhe o formato**.

#### 6.7.3 `desenharRosca`: gráfico "pizza" com um truque de CSS

```js
function desenharRosca(idElemento, contagem, cores = {}) {
  const itens = Object.entries(contagem);
  const total = itens.reduce((soma, [, quantidade]) => soma + quantidade, 0);
  const destino = document.getElementById(idElemento);
  if (!total) { destino.innerHTML = '<p class="vazio">Sem dados no período.</p>'; return; }

  let inicio = 0;
  const corDe = (nome, i) => cores[nome] ?? PALETA[i % PALETA.length];
  const fatias = itens.map(([nome, quantidade], i) => {
    const fim = inicio + (quantidade / total) * 100;
    const fatia = `${corDe(nome, i)} ${inicio}% ${fim}%`;
    inicio = fim;
    return fatia;
  });
  ...
  destino.innerHTML = `<div class="rosca-area">
    <div class="rosca" style="background:conic-gradient(${fatias.join(',')})"><span>${total}</span></div>
    <ul class="legenda">${legenda}</ul></div>`;
}
```

**A ideia:** o CSS tem um gradiente chamado `conic-gradient` (gradiente em **cone**, tipo um ponteiro de relógio). Com cores **sem transição** (cada cor termina onde a próxima começa), vira um **gráfico de pizza**.

Exemplo com 3 status (`ABERTA: 2`, `CONCLUIDA: 5`, `CANCELADA: 3`, total 10):

| Item | Quantidade | Começa | Termina |
|---|---|---|---|
| ABERTA | 2 | 0% | 20% |
| CONCLUIDA | 5 | 20% | 70% |
| CANCELADA | 3 | 70% | 100% |

O JS produz:

```css
conic-gradient(#1f6fb2 0% 20%, #1b7f5c 20% 70%, #6f7f7a 70% 100%)
```

E o `inicio` (declarado com **`let`**, porque muda) vai **acumulando**: o fim de uma fatia é o começo da próxima.

**E o buraco no meio (rosca)?** É o CSS:

```css
.rosca::after {
  content: '';
  position: absolute;
  inset: 26px;           /* 26px de margem em volta = um círculo menor no centro */
  border-radius: 50%;
  background: var(--superficie);   /* cor do fundo do cartão */
}
```

Um círculo da cor do fundo é **colocado por cima**, cobrindo o miolo. Parece rosca, mas é uma pizza com um círculo em cima. 😄 O `<span>${total}</span>` (o número no centro) fica na frente (`z-index: 1`).

`corDe(nome, i)`: usa a cor definida em `cores` (ex.: `COR_STATUS`) **ou** pega da `PALETA` pela posição. O `i % PALETA.length` faz a paleta **dar a volta** se houver mais de 6 itens.

#### 6.7.4 `desenharFaturamentoMensal`: os 6 meses

```js
const meses = Array.from({ length: 6 }, (_, i) => {
  const data = new Date();
  data.setDate(1);
  data.setMonth(data.getMonth() - (5 - i));
  return data.toLocaleDateString('sv-SE').slice(0, 7);
});
```

- `Array.from({ length: 6 }, (_, i) => ...)` → cria uma lista de 6 itens, chamando a função pra cada posição `i` (de 0 a 5). O `_` é só o nome pra "valor que não vou usar".
- Em cada uma, pega **hoje**, volta `5 - i` meses (i=0 → 5 meses atrás; i=5 → este mês), e guarda `'2026-06'`, `'2026-07'`... (`slice(0, 7)` = os 7 primeiros caracteres de `2026-06-15`).

> 🕳️ **O `data.setDate(1)` vem ANTES do `setMonth` de propósito.** Se hoje for **31/12** e você voltar pra novembro (que só tem 30 dias), o JS "transborda" e vira **1º de dezembro**, pulando um mês. Fixando o dia em 1 **primeiro**, o problema desaparece. Mais um bug sutil que o código já previne.

```js
const totais = meses.map((mes) => somar(
  ordens.filter((o) => o.status === 'CONCLUIDA' && (o.dataExecucao || o.dataAbertura || '').startsWith(mes)), 'valor'));
```

Pra cada mês: filtra as OS **concluídas** cuja data **começa com** `'2026-11'` (funciona porque a data é ISO, 2.17) e **soma** o valor. A data usada é a de **execução**, ou a de abertura se faltar. O `|| ''` final evita erro se as duas faltarem (`undefined.startsWith` quebraria).

Depois, cada coluna tem altura **proporcional ao maior mês** (`(totais[i] / maior) * 100`%). A etiqueta `"12,3 mil"` vem de `(totais[i] / 1000).toFixed(1).replace('.', ',')`. O nome do mês, `toLocaleDateString('pt-BR', { month: 'short' })` → "nov." (o `.replace('.', '')` tira o ponto).

> Esse gráfico recebe `todasOrdens` (e não as filtradas pelo período) porque o título já diz "últimos 6 meses". O seletor de período **não afeta** ele.

#### 6.7.5 `desenharTabelaResumo`: tabela genérica

```js
function desenharTabelaResumo(idElemento, cabecalhos, linhas, textoVazio) { ... }
```

Recebe **os cabeçalhos**, **as linhas** (cada linha é uma lista de textos/HTML) e **o texto se estiver vazio**. Usada pra "Últimas ordens de serviço" e "Contratos vencendo em 30 dias". Mesma ideia das barras: **uma função, vários usos**.

#### 6.7.6 `montarDashboard`: juntando tudo

##### Passo 1: buscar os dados **uma vez só**

```js
const [clientes, contratos, todasOrdens, funcionarios, equipamentos] = await Promise.all(
  ['clientes', 'contratos', 'ordensServico', 'funcionarios', 'equipamentos'].map((chave) => Repositorio.listar(ENTIDADES[chave].recurso)));
```

Faz **5 buscas em paralelo** (`Promise.all`) e já separa cada resultado numa variável (desestruturação). O `.map` converte cada **chave** em uma **busca** (e `ENTIDADES[chave].recurso` pega `'ordens-servico'` pra `ordensServico`).

##### Passo 2: criar dicionários id → nome

```js
const nomeFuncionario = new Map(funcionarios.map((f) => [f.id, f.nome]));
const nomeContrato = new Map(contratos.map((c) => [c.id, c.descricao]));
const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]));
const clienteDoContrato = new Map(contratos.map((c) => [c.id, nomeCliente.get(c.clienteId)]));
```

O último é uma **composição**: `contrato → cliente → nome`. Uma OS só tem `contratoId`; pra mostrar o **cliente** da OS, vai `OS → contrato → cliente`. Como no banco: uma "junção" (JOIN) feita no JS.

##### Passo 3: `atualizar()`, o que roda **a cada mudança do período**

Esse é um ponto de **design importante**: os dados são buscados **uma vez** (acima), mas a função `atualizar()` roda **toda vez que você troca o período** no seletor, e ela **só recalcula em memória** (sem pedir nada de novo ao servidor). Trocar de "30 dias" pra "6 meses" é **instantâneo**.

```js
const dias = Number(seletor.value);
const ordens = dias ? todasOrdens.filter((o) => (o.dataAbertura || '') >= dataEmDias(-dias)) : todasOrdens;
```

- O `<select>` devolve **texto** (`"30"`), então `Number(...)`.
- `dias ? ... : todasOrdens` → o valor `0` ("Todo o período") é **falso**, então usa todas. Senão, filtra as OS cuja `dataAbertura` é **maior ou igual a** "hoje − N dias" (comparação de texto ISO! 2.17).

```js
const concluidas = ordens.filter((o) => o.status === 'CONCLUIDA');
const faturamento = somar(concluidas, 'valor');
const emAberto = ordens.filter((o) => ['ABERTA', 'EM_ANDAMENTO'].includes(o.status)).length;
const vencendo = contratos.filter((c) => c.dataFim >= dataEmDias(0) && c.dataFim <= dataEmDias(30));
```

| Variável | Significado |
|---|---|
| `concluidas` | OS do período com status CONCLUIDA |
| `faturamento` | Soma do `valor` das concluídas |
| `emAberto` | Quantidade de OS ABERTA ou EM_ANDAMENTO (`['A','B'].includes(x)` é uma forma curta de `x === 'A' \|\| x === 'B'`) |
| `vencendo` | Contratos cuja data fim está **entre hoje e hoje+30 dias** |

##### Os cartões de cima

```js
document.getElementById('cartoes').innerHTML = [
  ['Clientes', clientes.length, 'Cliente.html'], ['Contratos ativos', contratos.length, 'Contrato.html'],
  ['OS em aberto', emAberto, 'Servico.html'], ['Faturamento no período', formatarMoeda(faturamento)],
  ...
].map(([nome, valor, link]) => {
  const conteudo = `<small>${nome}</small><strong>${valor}</strong>`;
  return link ? `<a class="cartao" href="${link}">${conteudo}</a>` : `<div class="cartao">${conteudo}</div>`;
}).join('');
```

**Dados descritos em uma lista:** cada cartão é `[nome, valor, link opcional]`. O `.map` transforma em HTML: **com link** vira `<a>` (clicável), **sem link** vira `<div>`. De novo a ideia *data-driven*: pra adicionar um cartão, **adiciona uma linha na lista**.

##### Agregações "agrupar e somar"

```js
const porFuncionario = {};
for (const ordem of concluidas) {
  const nome = nomeFuncionario.get(ordem.funcionarioId) ?? 'Sem funcionário';
  porFuncionario[nome] = (porFuncionario[nome] || 0) + (ordem.valor || 0);
}
```

O padrão mais clássico da programação: **usar um objeto como dicionário de acumuladores**. Pra cada OS: descobre o nome do funcionário, e **soma** o valor naquele nome. `(porFuncionario[nome] || 0) + valor` → "o que já tinha (ou 0 se for a 1ª vez) + o novo". Resultado: `{ 'Rafael Costa': 4200, 'Bruno Martins': 3100, ... }`, que alimenta o `desenharBarras`.

```js
const idsOs = new Set(ordens.map((o) => o.id));
const liquidoPorServico = {};
for (const item of servicosRealizados.filter((s) => idsOs.has(s.osId))) {
  const nome = nomeServico.get(item.servicoId) ?? 'Serviço';
  liquidoPorServico[nome] = (liquidoPorServico[nome] || 0) + item.qtd * item.valor - (item.desconto || 0);
}
```

Faturamento **líquido** por serviço = `quantidade × valor − desconto`. O `Set` (`idsOs.has(...)`) responde rápido "essa OS está no período escolhido?", pra contar **só serviços das OS do período**.

##### Desenhando tudo

```js
desenharFaturamentoMensal('graficoFaturamento', todasOrdens);
desenharRosca('graficoStatus', contarPor(ordens, 'status'), COR_STATUS);
desenharBarras('graficoTipoOs', contarPor(ordens, 'tipoOs'));
...
```

Repare como ficou **limpo**: cada gráfico é **uma linha**, que diz "desenhe **neste elemento** os dados **desse jeito**". O `id` (`'graficoStatus'`) é o **contrato** entre o JS e o `Dashboard.html`, onde existe `<div id="graficoStatus">`. Se renomear um dos dois lados, o gráfico some.

##### Últimas OS

```js
const recentes = [...ordens].sort((a, b) => (b.dataAbertura || '').localeCompare(a.dataAbertura || '')).slice(0, 5);
```

- `[...ordens]` **copia** a lista antes de ordenar, porque `.sort()` **altera** a lista original. Sem a cópia, você bagunçaria `ordens` pra todo o resto.
- `localeCompare` compara textos (as datas ISO); `b` antes de `a` = **mais recente primeiro**.
- `.slice(0, 5)` = as 5 mais recentes.

##### O fim da função

```js
seletor.addEventListener('change', atualizar);
atualizar();
```

Quando o período muda → recalcula. E roda **uma vez agora** pra desenhar a primeira versão.

#### Por que gráficos "na unha" e não Chart.js?

✅ **Zero dependências** (nada de CDN, funciona offline, não quebra com atualização de biblioteca).
✅ **Leve e rápido**.
✅ **Combina com o tema** (usa as mesmas variáveis CSS: cores do tema escuro e do alto contraste vêm de graça).
✅ **Você entende cada pixel.**
⚖️ **Preço:** sem animação, sem tooltips elaboradas, sem eixos. Se um dia precisar de gráficos mais sofisticados, aí vale trocar por uma biblioteca.

> 📌 **Observação de arquitetura:** o dashboard **calcula tudo no navegador**, baixando todas as listas. Isso é ótimo com poucas centenas de registros. Se o banco crescer pra dezenas de milhares, o ideal é o **back-end calcular** (com `GROUP BY` ou as *views* SQL) e o front só desenhar. O README (seção 15) já prevê esses endpoints opcionais.

---

### 6.8 Inicialização: as últimas 4 linhas

```js
if (USAR_DADOS_FALSOS && typeof semearDadosDeExemplo === 'function') semearDadosDeExemplo();
montarMenu();
document.querySelectorAll('[data-entidade]').forEach(iniciarTelaCrud);
if (document.getElementById('cartoes')) montarDashboard();
```

Tudo que foi escrito acima são **definições** (receitas guardadas). **Nada rodou ainda.** Estas 4 linhas é que **acionam** o sistema:

1. Se for modo teste, **cria os dados de exemplo**.
2. **Monta o menu** (em todas as páginas).
3. Acha **todos os elementos com `data-entidade`** e chama `iniciarTelaCrud` em cada. (`forEach` chama a função passando o elemento; como `iniciarTelaCrud(secao)` só usa o 1º argumento, os extras que o `forEach` manda são ignorados.) Em `index.html`/`Dashboard.html` não existe nenhum, então **não acontece nada**; em `Contrato.html` existem 2, então **monta 2 telas**.
4. Se a página tem um elemento `#cartoes`, é o Dashboard → `montarDashboard()`.

> 🎯 **O padrão "a página se declara":** o **mesmo `script.js`** roda em **todas** as páginas, e ele **descobre sozinho** o que fazer olhando pro HTML. Quer uma tela de cadastro nova? Descreva a entidade em `ENTIDADES` e coloque `<section data-entidade="fornecedores">` no HTML: **pronto, o JS monta**. O HTML só **declara o que quer**.

**Por que não precisa de `DOMContentLoaded`?** Esse evento significa "o HTML terminou de carregar". Como os `<script>` estão **no final do `<body>`**, quando eles rodam o HTML **já foi lido**, então `getElementById` e `querySelectorAll` já encontram tudo. (Se o script estivesse no `<head>`, rodaria **antes** do HTML existir e não acharia nada.)

---

## 7. `configuracoes.js` — o botão ⚙

### 7.1 O que ele faz

Adiciona em **toda página** um botão ⚙ que abre uma janela com preferências: tema claro/escuro, cor de destaque, tamanho da letra, densidade das tabelas, alto contraste, fonte de leitura facilitada etc. As escolhas ficam salvas e valem **para todas as telas**.

### 7.2 Por que `localStorage` aqui (e `sessionStorage` no login)?

Preferências visuais precisam **sobreviver**: se você escolheu tema escuro, quer ele de novo amanhã e em **todas as páginas** (lembra: cada página é um carregamento novo). `localStorage` dura pra sempre e é compartilhado entre abas. Já a sessão de login deve **expirar**, por isso é `sessionStorage`.

### 7.3 As tabelas de configuração (de novo, *data-driven*!)

```js
const CORES_DE_DESTAQUE = {
  verde: { nome: 'Verde', principal: '#1b7f5c', escura: '#14604a' },
  azul: { nome: 'Azul', principal: '#1f6fb2', escura: '#17507f' },
  laranja: { nome: 'Laranja', principal: '#d9731a', escura: '#a85610' },
  roxo: { nome: 'Roxo', principal: '#7b4bb3', escura: '#5b3585' },
};

const CONFIGURACOES_PADRAO = {
  tema: 'claro', cor: 'verde', tamanhoFonte: '16',
  densidade: 'confortavel', zebra: false, menuVisivel: true,
  altoContraste: false, fonteLegivel: false, espacamentoLinhas: false, destacarFoco: false, reduzirAnimacoes: false,
};

const CLASSE_POR_OPCAO = {
  zebra: 'zebra', altoContraste: 'alto-contraste', fonteLegivel: 'fonte-legivel',
  espacamentoLinhas: 'espacamento-linhas', destacarFoco: 'foco-forte', reduzirAnimacoes: 'sem-animacoes',
};
```

- **`CORES_DE_DESTAQUE`**: cada cor tem uma versão principal e uma escura (pra hover/botões). **Adicionar uma cor nova = 1 linha**, e ela já aparece no select (veremos abaixo).
- **`CONFIGURACOES_PADRAO`**: o estado inicial de tudo. Repare que `tamanhoFonte` é **texto** (`'16'`), porque o valor que vem de um `<select>` sempre é texto; manter igual evita comparações erradas.
- **`CLASSE_POR_OPCAO`**: liga cada opção **verdadeiro/falso** a **uma classe CSS**. Ligou "Alto contraste"? O JS põe a classe `alto-contraste` na tag `<html>`, e o CSS (`.alto-contraste button {...}`) cuida do resto. **O JS só liga e desliga interruptores; o CSS decide o que cada um muda.**

```js
const GRUPOS_DE_CONFIGURACOES = [
  { titulo: 'Visual', itens: [
    { chave: 'tema', rotulo: 'Tema', tipo: 'select', opcoes: [['claro', 'Claro'], ['escuro', 'Escuro']] },
    { chave: 'cor', rotulo: 'Cor de destaque', tipo: 'select',
      opcoes: Object.entries(CORES_DE_DESTAQUE).map(([chave, cor]) => [chave, cor.nome]) },
    ...
```

Aqui a **janela de configurações inteira é descrita** como dados: grupos → itens → (chave, rótulo, tipo, opções). Igual ao `ENTIDADES`. Repare no `opcoes` da cor: ele **gera as opções a partir de `CORES_DE_DESTAQUE`**; por isso, ao adicionar uma cor lá, ela surge no select automaticamente, **sem tocar em mais nada**.

### 7.4 Ler e gravar

```js
function lerConfiguracoes() {
  const salvas = JSON.parse(localStorage.getItem(CHAVE_CONFIGURACOES) || '{}');
  return { ...CONFIGURACOES_PADRAO, ...salvas };
}

const gravarConfiguracoes = (configuracoes) =>
  localStorage.setItem(CHAVE_CONFIGURACOES, JSON.stringify(configuracoes));
```

O `{ ...PADRAO, ...salvas }` é **muito esperto**. As propriedades de `salvas` vêm **depois**, então **sobrescrevem** o padrão. Mas as que **não foram salvas** ficam com o valor padrão. Isso significa que, se você adicionar uma opção **nova** no futuro, quem já tem preferências salvas **ganha a opção nova com o valor padrão** em vez de `undefined`. Compatibilidade com o passado, de graça.

### 7.5 Aplicar na tela

```js
function aplicarCorDeDestaque(raiz, configuracoes) {
  const cor = CORES_DE_DESTAQUE[configuracoes.cor] ?? CORES_DE_DESTAQUE.verde;
  if (configuracoes.altoContraste) {
    raiz.style.removeProperty('--verde');
    raiz.style.removeProperty('--verde-escuro');
    return;
  }
  raiz.style.setProperty('--verde', cor.principal);
  raiz.style.setProperty('--verde-escuro', cor.escura);
}

function aplicarConfiguracoes(configuracoes) {
  const raiz = document.documentElement;
  raiz.dataset.tema = configuracoes.tema;
  raiz.style.fontSize = `${configuracoes.tamanhoFonte}px`;
  aplicarCorDeDestaque(raiz, configuracoes);
  raiz.classList.toggle('compacta', configuracoes.densidade === 'compacta');
  for (const [opcao, classe] of Object.entries(CLASSE_POR_OPCAO)) {
    raiz.classList.toggle(classe, configuracoes[opcao]);
  }
  document.getElementById('menu').hidden = !configuracoes.menuVisivel;
}
```

#### O truque central: **variáveis CSS**

No `style.css`:

```css
:root {
  --verde: #1b7f5c;
  --fundo: #f1f6f5;
  --texto: #1f2d2a;
  --superficie: #fff;
}

:root[data-tema="escuro"] {
  --fundo: #121c19;
  --texto: #e6efec;
  --superficie: #1c2b26;
}
```

**Todo o CSS usa `var(--fundo)`, `var(--texto)`, etc.** em vez de cores soltas. Então, trocar o tema é só **trocar o valor dessas variáveis**, e a página inteira muda de cor sozinha. O tema escuro inteiro cabe em **~6 linhas**. 🌙

Como o JS conversa com isso:

| Configuração | O que o JS faz | O que acontece |
|---|---|---|
| Tema | `raiz.dataset.tema = 'escuro'` | Põe `data-tema="escuro"` em `<html>` → o CSS `:root[data-tema="escuro"]` entra em vigor |
| Cor | `raiz.style.setProperty('--verde', ...)` | Escreve a variável **direto no `<html>`** → vence a do arquivo CSS |
| Tamanho da letra | `raiz.style.fontSize = '18px'` | O CSS usa **`rem`** (unidade relativa ao tamanho da fonte do `<html>`), então **tudo escala junto** |
| Opções sim/não | `classList.toggle(classe, true/false)` | Liga/desliga a classe CSS |
| Menu | `menu.hidden = ...` | Esconde/mostra o menu lateral |

- `raiz = document.documentElement` é a tag `<html>` (o elemento mais externo). Colocar variáveis e classes **nela** afeta a página inteira.
- `classList.toggle('zebra', true)` com **2º argumento booleano** funciona como "ligue" (`true`) ou "desligue" (`false`); sem ele, alternaria.
- **Por que no alto contraste se removem as cores (`removeProperty`)?** Estilos escritos direto no elemento (`style="..."`) **têm prioridade sobre o CSS**. Se o JS mantivesse a cor laranja inline, a regra `.alto-contraste` do CSS **nunca venceria**. Removendo, o CSS volta a mandar.
- `CORES_DE_DESTAQUE[configuracoes.cor] ?? CORES_DE_DESTAQUE.verde` → se a cor salva não existir mais (você removeu do código), **cai no verde** em vez de quebrar.

> 📝 **Curiosidade de nomes:** as variáveis chamam-se `--verde`, mas agora guardam **a cor de destaque, seja qual for**. Funciona perfeitamente; só é um "nome de herança". Se um dia quiser, renomear pra `--destaque` seria uma melhoria de legibilidade (buscar e substituir no JS e no CSS).

### 7.6 A janela (gerada a partir da tabela)

```js
function criarHtmlDoItem(item, configuracoes) {
  const valor = configuracoes[item.chave];
  const entrada = item.tipo === 'checkbox'
    ? `<input type="checkbox" name="${item.chave}" ${valor ? 'checked' : ''}>`
    : `<select name="${item.chave}">${item.opcoes.map(([v, t]) =>
        `<option value="${v}" ${v === valor ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  return `<label>${item.rotulo}${entrada}</label>`;
}
```

Mesmo estilo do `criarHtmlDoCampo`: gera **um item** a partir da descrição. Marca `checked` / `selected` conforme o valor **atual**, então a janela sempre abre refletindo o que está ligado.

```js
function preencherJanela(janela) {
  const configuracoes = lerConfiguracoes();
  const grupos = GRUPOS_DE_CONFIGURACOES.map((grupo) => `
    <fieldset><legend>${grupo.titulo}</legend>
      ${grupo.itens.map((item) => criarHtmlDoItem(item, configuracoes)).join('')}
    </fieldset>`).join('');
  janela.innerHTML = `<form class="configuracoes" method="dialog"><h2>Configurações</h2>${grupos}
    <div class="rodape">
      <button type="button" class="secundario" data-restaurar>Restaurar padrão</button>
      <button type="submit">Fechar</button>
    </div></form>`;
}
```

Os **`<fieldset>` + `<legend>`** agrupam campos de forma **semanticamente correta** (leitores de tela anunciam o grupo). O botão "Fechar" é `type="submit"` num formulário `method="dialog"`, então **fecha a janela** (o mesmo truque do CRUD).

```js
function lerEscolhasDaJanela(formulario) {
  const escolhas = {};
  for (const grupo of GRUPOS_DE_CONFIGURACOES) {
    for (const item of grupo.itens) {
      const elemento = formulario.elements[item.chave];
      escolhas[item.chave] = item.tipo === 'checkbox' ? elemento.checked : elemento.value;
    }
  }
  return escolhas;
}
```

Faz o caminho **inverso**: percorre a **mesma tabela** e lê cada campo. Checkbox → `.checked` (`true/false`); select → `.value` (texto).

### 7.7 `iniciarConfiguracoes`: criando o botão ⚙ por código

```js
function iniciarConfiguracoes() {
  const botao = document.createElement('button');
  botao.className = 'botao-configuracoes';
  botao.title = 'Configurações do sistema';
  botao.setAttribute('aria-label', 'Abrir configurações do sistema');
  botao.textContent = '⚙';

  const janela = document.createElement('dialog');
  document.body.append(botao, janela);

  botao.addEventListener('click', () => { preencherJanela(janela); janela.showModal(); });

  janela.addEventListener('change', (evento) => {
    const configuracoes = lerEscolhasDaJanela(evento.target.form);
    gravarConfiguracoes(configuracoes);
    aplicarConfiguracoes(configuracoes);
  });

  janela.addEventListener('click', (evento) => {
    if (!evento.target.matches('[data-restaurar]')) return;
    gravarConfiguracoes(CONFIGURACOES_PADRAO);
    aplicarConfiguracoes(CONFIGURACOES_PADRAO);
    preencherJanela(janela);
  });

  aplicarConfiguracoes(lerConfiguracoes());
}

iniciarConfiguracoes();
```

- **`document.createElement`** cria elementos **do zero por código**. Por isso o botão ⚙ **não existe em nenhum HTML**: basta incluir o `<script>` e o botão aparece. Pra adicionar a funcionalidade a uma página nova: **uma linha de script**.
- `aria-label` dá um **nome acessível** ao botão (o `⚙` sozinho não diz nada a um leitor de tela).
- `document.body.append(botao, janela)` coloca os dois na página.
- **Clicou no ⚙** → monta o conteúdo **na hora** (com os valores atuais) e abre.
- **`change` na janela (delegação de novo!):** um único ouvinte na janela captura a mudança de **qualquer** campo (o evento `change` "sobe" do campo até a janela). `evento.target.form` é o formulário ao qual **aquele campo pertence**. Então: lê **tudo** → **grava** → **aplica**. Resultado: **efeito ao vivo**, sem botão "Salvar". Você muda o tema e a tela muda na hora.
- **Restaurar padrão:** o ouvinte de `click` escuta a janela inteira, e `evento.target.matches('[data-restaurar]')` pergunta "o elemento clicado é o botão de restaurar?". Se **não** for, `return` (ignora). Se for: grava os padrões, aplica e **redesenha** a janela com os valores padrão.
- **A última linha** (`aplicarConfiguracoes(lerConfiguracoes())`) aplica as preferências salvas **assim que a página carrega**.

> 💡 **Detalhe de experiência:** como esse script roda **no final** da página, pode ocorrer um **"piscadinha"** com o tema claro por uma fração de segundo antes do escuro entrar. Uma melhoria futura é colocar um mini-script no `<head>` só pra aplicar o tema antes de desenhar a tela.

---

## 8. `relatorios.js` — gerando PDF

### 8.1 O que ele faz

Na tela **Relatórios**, você escolhe o **tipo** (OS, contratos, clientes...), um **filtro** opcional, o **período**, as **colunas** que quer, e clica em **Gerar PDF**. O arquivo é baixado.

### 8.2 As bibliotecas externas

No `Relatorio.html`, **antes** dos seus scripts:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
```

- **jsPDF** cria PDFs no navegador.
- **AutoTable** é um **plugin** do jsPDF que desenha tabelas bonitas (quebra de página, cabeçalho repetido etc.).
- **CDN** (*Content Delivery Network*) = servidor público que hospeda bibliotecas. Você aponta o `<script>` pra lá, sem baixar nada.
- Elas precisam vir **antes** do `relatorios.js` (a mesma regra de ordem da seção 1.6), porque ele usa `window.jspdf`.
- **Só a página de relatório as carrega**, porque só ela precisa. As outras ficam mais leves.

> ⚠️ Isso significa que **a geração de PDF precisa de internet** (pra baixar a biblioteca do CDN).

### 8.3 A configuração dos relatórios

```js
const CONFIGURACAO_RELATORIOS = {
  ordensServico: { campoData: 'dataAbertura', campoFiltro: 'status' },
  contratos: { campoData: 'dataInicio', campoFiltro: 'tipoContrato' },
  servicos: { campoData: 'dataInicio' },
  equipamentos: {},
  clientes: { campoFiltro: 'tipoCliente' },
  funcionarios: {},
};
```

**Mais uma tabela de receitas.** Pra cada relatório, só **duas coisas** mudam:

| Opção | Significado |
|---|---|
| `campoData` | Qual campo de data usar pra filtrar por período. **Se não tem, o período fica desativado** (clientes não têm data, por exemplo) |
| `campoFiltro` | Qual campo de lista vira o filtro extra (ex.: status da OS) |

O resto (título, colunas, tipos) vem de **`ENTIDADES`**, o **mesmo objeto** das telas de cadastro. Os nomes das chaves (`ordensServico`, `clientes`...) são os mesmos de lá. **Essa é a recompensa do design data-driven:** uma descrição serve a **duas** funcionalidades, e uma coluna nova em `ENTIDADES.clientes.campos` **já aparece como opção no relatório**.

```js
const COLUNAS_PARA_PAISAGEM = 5;
const COR_CABECALHO_PDF = [27, 127, 92];
```

**Constantes com nome** em vez de "números mágicos" perdidos no código. `COLUNAS_PARA_PAISAGEM = 5` diz **o porquê** do número 5 mais adiante. `[27, 127, 92]` é o verde da marca em RGB (`#1b7f5c`).

### 8.4 `iniciarTelaRelatorios`

#### Preenchendo o select de tipos

```js
formulario.elements.tipo.innerHTML = Object.keys(CONFIGURACAO_RELATORIOS)
  .map((chave) => `<option value="${chave}">${ENTIDADES[chave].titulo}</option>`).join('');
```

Cria uma `<option>` pra cada relatório, com o `titulo` vindo de `ENTIDADES`.

#### `atualizarOpcoes`: adapta o formulário ao tipo escolhido

```js
function atualizarOpcoes() {
  const chave = formulario.elements.tipo.value;
  const entidade = ENTIDADES[chave];
  const { campoData, campoFiltro } = CONFIGURACAO_RELATORIOS[chave];

  document.getElementById('colunasRelatorio').innerHTML = entidade.campos.map((c) => `
    <label><input type="checkbox" name="colunas" value="${c.nome}" ${entidade.colunas.includes(c.nome) ? 'checked' : ''}>
      ${c.rotulo}</label>`).join('');

  formulario.elements.dataInicial.disabled = !campoData;
  formulario.elements.dataFinal.disabled = !campoData;

  const rotuloFiltro = document.getElementById('rotuloFiltro');
  rotuloFiltro.hidden = !campoFiltro;
  if (!campoFiltro) return;
  const definicao = entidade.campos.find((c) => c.nome === campoFiltro);
  rotuloFiltro.firstChild.textContent = definicao.rotulo;
  formulario.elements.filtro.innerHTML = '<option value="">Todos</option>' +
    definicao.opcoes.map((opcao) => `<option value="${opcao}">${formatarOpcao(opcao)}</option>`).join('');
}
```

Sempre que o tipo muda, **recalcula tudo**:

1. **Checkboxes de colunas:** um por campo da entidade. Vêm **marcados** os que já são colunas da tabela (`entidade.colunas.includes(c.nome)`).
2. **Datas:** desativa os campos de período se esse relatório não tem `campoData`.
3. **Filtro:** esconde se não tem; se tem, **troca o texto do rótulo** pelo nome do campo (ex.: "Status") e **preenche as opções** com as do campo (`definicao.opcoes`) + "Todos".
4. O **`return` antecipado** (`if (!campoFiltro) return;`) evita continuar quando não há filtro (*guard clause* de novo).

> 🔎 `rotuloFiltro.firstChild.textContent` mexe no **primeiro "filho"** do `<label>`, que é o texto antes do `<select>`. Funciona, mas é **frágil**: se alguém colocar um espaço ou quebra de linha antes do texto no HTML, o "primeiro filho" muda. Uma versão mais robusta seria envolver o texto num `<span>` e mexer no span.

#### `filtrarRegistros`

```js
function filtrarRegistros(registros, chave) {
  const { campoData, campoFiltro } = CONFIGURACAO_RELATORIOS[chave];
  const { dataInicial, dataFinal, filtro } = formulario.elements;
  return registros.filter((registro) => {
    const data = registro[campoData];
    const dentroDoPeriodo = !campoData
      || ((!dataInicial.value || data >= dataInicial.value) && (!dataFinal.value || data <= dataFinal.value));
    const passaNoFiltro = !campoFiltro || !filtro.value || registro[campoFiltro] === filtro.value;
    return dentroDoPeriodo && passaNoFiltro;
  });
}
```

Um registro **só passa** se cumprir **as duas** condições (`&&`):

- **Período:** passa se o relatório **não usa data** (`!campoData`), **ou** (a data inicial está vazia **ou** a data é maior/igual) **e** (a final está vazia **ou** a data é menor/igual). Datas vazias significam "sem limite". Comparação de **texto ISO** (2.17).
- **Filtro:** passa se o relatório não tem filtro, **ou** o usuário deixou "Todos", **ou** o valor do registro é igual ao escolhido.

A estrutura `!condicao || ...` é um padrão: **"se a restrição não se aplica, passa direto"**.

#### `descreverPeriodo`

Gera o texto do cabeçalho do PDF: "Período: todos os registros" ou "Período: 01/10/2026 a hoje" (use `formatarData` do `script.js`).

#### `montarPdf`

```js
function montarPdf(entidade, colunas, linhas, registros) {
  const { jsPDF } = window.jspdf;
  const orientacao = colunas.length > COLUNAS_PARA_PAISAGEM ? 'landscape' : 'portrait';
  const documento = new jsPDF({ orientation: orientacao });

  documento.setFontSize(16);
  documento.text(`AR Ecológico - Relatório de ${entidade.titulo}`, 14, 16);
  documento.setFontSize(10);
  documento.text(`${descreverPeriodo()}  |  Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 23);

  documento.autoTable({
    startY: 28,
    head: [colunas.map((c) => c.rotulo)],
    body: linhas,
    headStyles: { fillColor: COR_CABECALHO_PDF },
    styles: { fontSize: 9 },
  });

  let posicaoY = documento.lastAutoTable.finalY + 8;
  documento.text(`Total de registros: ${registros.length}`, 14, posicaoY);
  for (const coluna of colunas.filter((c) => c.moeda)) {
    posicaoY += 6;
    const soma = registros.reduce((total, r) => total + (r[coluna.nome] || 0), 0);
    documento.text(`Total de ${coluna.rotulo}: ${formatarMoeda(soma)}`, 14, posicaoY);
  }
  return documento;
}
```

- `window.jspdf` é o "pacote" que a biblioteca coloca na página; `{ jsPDF }` tira dele a classe.
- **Orientação automática:** mais de 5 colunas → **paisagem** (deitado), senão retrato. (Aqui aparece a constante `COLUNAS_PARA_PAISAGEM`.)
- `documento.text(texto, x, y)` escreve texto em uma **posição (em milímetros)** da folha. `14` é a margem esquerda; `16`, a altura.
- `autoTable({...})`: `head` é o cabeçalho (uma lista **dentro de** uma lista, porque aceita várias linhas de cabeçalho), `body` são as linhas, `startY` é onde começa (depois do título).
- **`documento.lastAutoTable.finalY`**: depois de desenhar a tabela, o plugin guarda **onde ela terminou**. Dá pra escrever os totais logo abaixo (`+ 8`), sem saber quantas linhas a tabela teve.
- **Totais:** pra cada coluna que é **dinheiro** (`moeda: true`), soma os valores e imprime. Sai de graça pra qualquer entidade que tenha campo monetário.
- Devolve o `documento` **sem salvar**: quem chama decide o que fazer. (Montar ≠ salvar: responsabilidades separadas.)

#### `gerarRelatorio`: o orquestrador

```js
async function gerarRelatorio(evento) {
  evento.preventDefault();
  const chave = formulario.elements.tipo.value;
  const entidade = ENTIDADES[chave];
  const nomesEscolhidos = [...formulario.querySelectorAll('[name=colunas]:checked')].map((c) => c.value);
  if (!nomesEscolhidos.length) { mensagem.textContent = 'Escolha pelo menos uma coluna.'; return; }

  const colunas = entidade.campos.filter((c) => nomesEscolhidos.includes(c.nome));
  const registros = filtrarRegistros(await Repositorio.listar(entidade.recurso), chave);
  if (!registros.length) { mensagem.textContent = 'Nenhum registro encontrado para esses filtros.'; return; }

  const rotulos = await carregarRotulos(entidade);
  const linhas = registros.map((r) => colunas.map((c) => formatarCelula(c, r[c.nome], rotulos)));
  const hoje = new Date().toISOString().slice(0, 10);

  montarPdf(entidade, colunas, linhas, registros).save(`relatorio-${chave}-${hoje}.pdf`);
  mensagem.textContent = `Relatório gerado com ${registros.length} registro(s).`;
}
```

O passo a passo é uma **receita linear**:

1. `evento.preventDefault()` → aqui **é necessário** (o form **não** é `method="dialog"`, então sem isso a página recarregaria).
2. Descobre as colunas marcadas: `[name=colunas]:checked` é um seletor CSS "os campos de nome `colunas` que estão marcados". O spread `[...]` converte o resultado (uma "NodeList") numa lista de verdade, pra poder usar `.map`.
3. **Validações com saída antecipada** (nada marcado → avisa e para; nenhum registro → avisa e para).
4. Filtra as colunas e os registros.
5. **Reutiliza `carregarRotulos` e `formatarCelula` do `script.js`**: o PDF mostra "Ana Ribeiro", não `clienteId: 5`, e `R$ 350,00`, não `350`. (Por isso essas funções devolvem **texto puro**; lembra do `celulaDaTabela`?)
6. `registros.map(r => colunas.map(c => ...))` → uma **matriz** (lista de linhas, cada linha uma lista de células), exatamente o formato que o `autoTable` espera em `body`.
7. `.save(nome)` faz o **download** do arquivo.
8. Mensagem de sucesso.

> 🎯 **A ordem das colunas no PDF** segue a ordem dos `campos` em `ENTIDADES`, não a ordem em que você clicou os checkboxes (o `filter` percorre `entidade.campos`).

### 8.5 A última linha

```js
if (document.getElementById('formularioRelatorio')) iniciarTelaRelatorios();
```

Se esse arquivo for carregado numa página que **não** tem o formulário, **não faz nada** (o mesmo padrão de "a página se declara").

---

## 9. Como o HTML se encaixa em tudo isso

### 9.1 Páginas de cadastro: quase vazias

`Cliente.html` inteiro (o essencial):

```html
<body>
  <nav id="menu" class="menu"></nav>
  <main class="conteudo">
    <section data-entidade="clientes"></section>
  </main>
  <script src="../static/js/config.js"></script>
  ...
</body>
```

Duas coisas "ocas" pra o JS preencher:

- `<nav id="menu">` → o `montarMenu` põe o menu aqui (achando pelo **`id`**).
- `<section data-entidade="clientes">` → o `iniciarTelaCrud` constrói a tela aqui (achando pelo **`data-entidade`**).

`Contrato.html` e `Servico.html` têm **duas** `<section>` cada (contratos + equipamentos; OS + serviços): duas telas CRUD **independentes** na mesma página, graças aos *closures* e ao `secao.querySelector`.

### 9.2 `Dashboard.html`: os "buracos" com nome

```html
<div id="cartoes" class="cartoes"></div>
<div class="secao"><h3>OS por status</h3><div id="graficoStatus"></div></div>
```

Cada `<div id="graficoStatus">` é um **buraco com nome** esperando um gráfico. Os nomes precisam bater **exatamente** com os que o JS usa (`desenharRosca('graficoStatus', ...)`). Esse acordo de nomes entre HTML e JS é um **contrato**. Se você renomear de um lado só, o gráfico não aparece e o console (F12) mostra um erro do tipo `Cannot set properties of null (setting 'innerHTML')`: o `getElementById` não achou o elemento e devolveu `null`. **Olhe sempre o F12 quando algo sumir.**

O `<select id="periodo">` com `value="30"`, `"90"`, `"180"`, `"0"` é o que o `Number(seletor.value)` lê.

### 9.3 `Relatorio.html`: formulário escrito à mão

Aqui o formulário é HTML normal, **não** gerado por JS, porque é único. Mas o conteúdo dinâmico (tipos, colunas, filtros) é preenchido pelo `relatorios.js` nos elementos com `id` (`colunasRelatorio`, `rotuloFiltro`).

### 9.4 `login.html` e `index.html`

- `login.html`: `<body data-publica>` (a "chave" que libera a página sem login); um `<form id="formularioLogin">` com `name="email"` e `name="senha"`; `<p id="mensagemLogin" role="alert">` (o `role="alert"` faz leitores de tela **anunciarem o erro** automaticamente); e a dica de teste com `id="dicaTeste"` (que o JS esconde fora do modo teste). Carrega **só** `config.js` e `autenticacao.js` (não precisa do resto).
- `index.html`: cartões-atalho (links `<a class="cartao atalho">`) pra cada área. É a única página com conteúdo "escrito" no HTML, porque é só navegação.

### 9.5 Detalhes de HTML que ajudam

| Detalhe | Pra que serve |
|---|---|
| `<html lang="pt-BR">` | Leitores de tela e tradutores sabem o idioma |
| `<meta name="viewport" content="width=device-width, initial-scale=1">` | **Sem isso, o celular mostra a página "encolhida" como se fosse desktop.** Essencial pra responsividade |
| `<script>` no **final** do `<body>` | O HTML já existe quando o JS roda |
| `<dialog>` | Janela modal nativa (sem biblioteca) |
| `required`, `type="email"`, `type="date"`, `type="number"` | O navegador valida e mostra o teclado/calendário certo, **sem JS** |

---

## 10. Fluxos completos passo a passo

Aqui você acompanha **o que acontece, em ordem, na vida real**. É o melhor jeito de "ligar os pontos".

### 10.1 Fazendo login (modo teste)

1. Você abre `login.html`. O `<body data-publica>` impede o "porteiro" de te barrar.
2. `autenticacao.js` roda as últimas linhas: acha `#formularioLogin` → chama `iniciarTelaLogin()`.
3. `iniciarTelaLogin()` vê que **não há sessão**, então mostra o formulário. A dica de teste aparece (`USAR_DADOS_FALSOS` é `true`).
4. Você digita e clica **Entrar** → evento `submit` → `preventDefault()` → botão desativado.
5. `Autenticacao.entrar(email, senha)`: compara com `USUARIO_TESTE` → monta `{ token: 'token-de-teste', usuario: {...} }` → grava em `sessionStorage`.
6. `location.href = 'index.html'` → vai pro início.
7. No `index.html`, `autenticacao.js` acha uma página **sem** formulário de login e **sem** `data-publica` → `exigirLogin()` → **há sessão**, então não faz nada.
8. `script.js` roda: semeia dados, monta o menu ("Olá, **Administrador**").

### 10.2 Abrindo a tela de Clientes

1. Você clica em "Clientes" no menu → o navegador carrega `templates/Cliente.html`.
2. Os scripts rodam na ordem; `exigirLogin()` confirma a sessão.
3. `script.js`: `montarMenu()` preenche o `<nav>`.
4. `querySelectorAll('[data-entidade]')` acha `<section data-entidade="clientes">` → `iniciarTelaCrud(secao)`.
5. `iniciarTelaCrud` lê `ENTIDADES.clientes`, chama `criarEsqueleto` (título, busca, botão, tabela vazia, `<dialog>` com o formulário) e monta o `<thead>`.
6. `atualizarTabela()`:
   - `Promise.all` → `Repositorio.listar('clientes')` (lê do localStorage) **e** `carregarRotulos` (clientes não têm `origem`, então volta `{}`).
   - Aplica o filtro de busca (vazio, então passam todos).
   - Cada registro vira uma `<tr>`, com cada célula passando por `celulaDaTabela` → `formatarCelula`.
7. A tabela aparece com os 8 clientes de exemplo.

### 10.3 Cadastrando um cliente novo

1. Clica **+ Novo** → `abrirFormulario()` (sem argumento → `registro = {}`).
2. `preencherSelects()` cria as opções (FISICA/JURIDICA).
3. `formulario.reset()`; `id` fica vazio; todos os campos recebem `''`.
4. `atualizarCamposCondicionais()`: o select `tipoCliente` está vazio → **CPF, RG, e-mail, nascimento (FISICA) e CNPJ (JURIDICA) ficam escondidos e desativados**.
5. `janela.showModal()` → o formulário aparece.
6. Você escolhe **Física** → evento `change` → `atualizarCamposCondicionais()` → CPF, RG, nascimento e e-mail **aparecem**; CNPJ continua escondido.
7. Preenche e clica **Salvar** → o navegador valida os `required`; se faltar algo, **bloqueia** e avisa.
8. Tudo ok → evento `submit`:
   - `lerFormulario()` monta `{ tipoCliente: 'FISICA', nome: 'Carla', cpf: '...', ... }` (sem `id`, sem os campos escondidos/vazios; números convertidos).
   - `Repositorio.salvar('clientes', registro)` → sem `id` → **cria**: `[...lista, { ...registro, id: Date.now() }]` → `gravarLocal`.
   - `atualizarTabela()` → a tabela redesenha **com a Carla**.
9. Como o form é `method="dialog"`, a janela se fecha sozinha.

### 10.4 Editando

1. Clica **Editar** numa linha → o clique "sobe" até o `<tbody>`, onde está o ouvinte único.
2. `evento.target.dataset` → `{ editar: '1700000000000' }` (o id em texto).
3. Busca a lista e acha o registro (`r.id === Number(editar)`).
4. `abrirFormulario(registro)` → preenche tudo, **inclusive o `id` no campo hidden**.
5. Você altera e salva → `lerFormulario()` agora **inclui o `id`** → `Repositorio.salvar` vê o `id` → **edita** (no modo teste, `.map` troca o item; no modo real, `PUT /clientes/{id}`).

### 10.5 Trocando o período no Dashboard

1. `montarDashboard()` (rodou uma vez ao abrir): buscou **tudo** em paralelo, montou os dicionários `Map`, definiu `atualizar()`, ligou o `change` do seletor e chamou `atualizar()`.
2. Você troca "Últimos 6 meses" por "Últimos 30 dias" → evento `change` → `atualizar()`.
3. `Number(seletor.value)` = `30` → filtra `todasOrdens` por `dataAbertura >= dataEmDias(-30)`.
4. Recalcula cartões, agrupamentos e **redesenha cada gráfico** (`innerHTML` novo).
5. **Zero requisições novas.** Tudo em memória.

### 10.6 Gerando um relatório

1. Você abre `Relatorio.html` → `iniciarTelaRelatorios()` preenche o select de tipos e chama `atualizarOpcoes()`.
2. Escolhe "Ordens de Serviço" → `atualizarOpcoes()` mostra os checkboxes de colunas, ativa as datas e põe o filtro "Status".
3. Define período, status e colunas → **Gerar PDF** → `submit`.
4. `gerarRelatorio()`: valida → `Repositorio.listar` → `filtrarRegistros` → `carregarRotulos` → monta a matriz de linhas com `formatarCelula`.
5. `montarPdf()` desenha título, tabela e totais → `.save('relatorio-ordensServico-2026-11-14.pdf')` → download.

### 10.7 O que muda quando `USAR_DADOS_FALSOS = false`?

**Os fluxos acima são os mesmos.** A única diferença é **dentro do `Repositorio`** (e do `entrar`):

| Fluxo | Modo teste | Modo real |
|---|---|---|
| Login | Compara com `USUARIO_TESTE` | `POST /auth/login` |
| Listar | `localStorage` | `GET /clientes` |
| Criar | Adiciona na lista local | `POST /clientes` |
| Editar | `.map` na lista local | `PUT /clientes/{id}` |
| Excluir | `.filter` na lista local | `DELETE /clientes/{id}` |
| Sessão | Token falso | JWT do servidor, enviado no cabeçalho `Authorization` |

---

## 11. Ligando ao back-end (Spring Boot)

### 11.1 O contrato (resumo do README)

O front espera que a API siga esta "lei":

| Operação | Requisição | Resposta |
|---|---|---|
| Listar | `GET /api/{recurso}` | `200` + **array JSON** com todos os registros |
| Criar | `POST /api/{recurso}` | `200`/`201` + objeto salvo, com `id` |
| Editar | `PUT /api/{recurso}/{id}` | `200` + objeto salvo |
| Excluir | `DELETE /api/{recurso}/{id}` | `204` sem corpo |
| Login | `POST /api/auth/login` | `200` `{ token, usuario }` ou `401` |
| Só leitura | `GET /api/servicos-realizados` | usado pelo dashboard |

`{recurso}` ∈ `clientes`, `funcionarios`, `contratos`, `equipamentos`, `ordens-servico`, `servicos`.

### 11.2 Regras de formato (as que mais dão dor de cabeça)

| Regra | Por que existe (olhando o código) |
|---|---|
| Nomes dos campos em **camelCase**, **exatamente** como em `ENTIDADES` | `registro[c.nome]` acessa pelo nome. `tipo_cliente` ≠ `tipoCliente` e a coluna ficaria vazia |
| Datas **`yyyy-MM-dd`** (texto) | O código **compara datas como texto** (`>=`) e `formatarData` espera esse formato |
| Dinheiro e ids como **número JSON** | `somar`, `formatarMoeda` e os `Map` (`.get(3)` ≠ `.get('3')`) dependem do tipo |
| Enums em **MAIÚSCULAS** (`CONCLUIDA`, `EM_ANDAMENTO`) | `COR_STATUS`, as classes `selo-CONCLUIDA` e os filtros comparam esses textos exatos |
| **`401` só pra "não autenticado"** | `requisitar` **desloga** o usuário em qualquer `401` |
| `400` validação, `404` não existe, `409` exclusão bloqueada por chave estrangeira | `requisitar` transforma qualquer status ruim em erro `Erro 409 em DELETE ...` |

### 11.3 O que você muda no front

1. `config.js`: `USAR_DADOS_FALSOS = false` (e conferir `URL_API`).
2. Apagar `dados-exemplo.js` e a tag `<script>` dele nas páginas.
3. **Mais nada.** Esse foi o objetivo da arquitetura toda. 🎉

### 11.4 CORS (o erro que todo mundo encontra)

Se o front roda no Live Server (`localhost:5500`) e a API em `localhost:8080`, são **origens diferentes** (a porta conta). Por **segurança**, o navegador **bloqueia** o front de ler respostas de outra origem **a menos que o back-end autorize** (isso se chama **CORS**). O erro aparece no console como `blocked by CORS policy`. Quem faz a API precisa liberar a origem do front (o README, seção 14, mostra a configuração).

A alternativa é **servir o front pelo próprio Spring Boot**: o prefixo `static/` nos caminhos (`./static/css/style.css`) é o mesmo nome da pasta que o Spring Boot serve automaticamente (`src/main/resources/static`). Com front e API na mesma origem, **não existe CORS**.

### 11.5 `application.properties`

```properties
spring.application.name=demo
```

É o esqueleto padrão gerado pelo Spring Initializr: o projeto Spring ainda está **vazio**. A configuração real (SQL Server, JPA, JWT) está no README, seção 10.2.

---

## 12. Decisões de arquitetura: o porquê de cada escolha

| # | Decisão | Por que é boa aqui | Quando repensar |
|---|---|---|---|
| 1 | **JavaScript puro**, sem framework | Nada escondido; você aprende como a web **realmente** funciona; zero instalação | Quando o sistema tiver telas com **muito estado compartilhado** (aí React/Vue compensam) |
| 2 | **MPA** (várias páginas) | Simples; casa com Spring Boot/Thymeleaf; páginas independentes | Se quiser navegação instantânea sem recarregar |
| 3 | **Scripts clássicos** na ordem certa (sem `import`) | Leitura direta; funciona em qualquer servidor | Quando houver conflito de nomes ou muitos arquivos → **módulos ES** |
| 4 | **`ENTIDADES` data-driven** | 1 máquina + 6 receitas; campo novo = 1 linha; consistência total; reaproveitado nos relatórios | Telas muito diferentes do padrão (por isso o dashboard é manual) |
| 5 | **`Repositorio` + interruptor** | Telas não sabem de onde vêm os dados; troca de modo = 1 constante | Se precisar de **cache** ou **paginação**, é **aqui** que entra |
| 6 | **`requisitar` central** | Token, 401 e erros tratados em 1 lugar | Quando quiser exibir mensagens de erro do servidor |
| 7 | **Objeto `Autenticacao`** | Agrupa funções relacionadas, evita colisão de nomes | Com módulos, vira um arquivo exportando funções |
| 8 | **`sessionStorage`** pro login | Some ao fechar a aba (mais seguro) | Se precisar de "lembrar de mim", `localStorage` (com cuidado) ou cookie `HttpOnly` |
| 9 | **`localStorage`** pras preferências | Persistem e valem em todas as páginas | — |
| 10 | **HTML gerado com template literals** (`innerHTML`) | Simples, legível, sem biblioteca | **Precisa escapar dados** quando vierem do servidor (bug #4 da seção 13) |
| 11 | **`<dialog>` nativo** | Modal pronta (ESC, foco, fundo) sem biblioteca | — |
| 12 | **Variáveis CSS + `rem`** | Tema, cor e tamanho de letra mudam **em um ponto** | — |
| 13 | **Gráficos com CSS/`div`** | Sem dependência, leve, acompanha o tema | Se precisar de eixos, tooltips, animação → Chart.js |
| 14 | **Dashboard calcula no navegador** | Simples, instantâneo ao trocar o período | Com **muitos** registros, mover a conta pro back-end (`GROUP BY`/views) |
| 15 | **Datas como texto ISO** | Comparação trivial (`>=`), sem fuso horário | — |
| 16 | **`data-*` pro JS, `class` pro CSS** | Mudar visual não quebra lógica e vice-versa | — |
| 17 | **Delegação de eventos** | 1 ouvinte pra todos os botões, mesmo os recriados | — |
| 18 | **`async` em tudo no `Repositorio`** | Interface idêntica nos dois modos | — |
| 19 | **Funções pequenas, nomes em português descritivos, *early return*, constantes nomeadas** | Código legível (*Clean Code*, como você pediu) | — |
| 20 | **Página "se declara" (`data-entidade`, `id`s)** | Mesmo `script.js` em todas as páginas; HTML quase vazio | — |

---

## 13. 🐛 Bugs e melhorias que encontrei lendo o código

Li tudo com atenção e achei alguns pontos reais. **Os dois primeiros eu considero bugs de verdade** (mexem no uso do dia a dia). Os outros são melhorias e cuidados.

| # | Onde | Gravidade | Resumo |
|---|---|---|---|
| 1 | `autenticacao.js` (`sair` e `exigirLogin`) | 🔴 Alta | `'login.html'` é **relativo**: nas telas dentro de `templates/`, aponta pra `templates/login.html` (não existe) |
| 2 | `script.js` (`montarMenu`) | 🟡 Média | O item "ativo" do menu **nunca** é destacado |
| 3 | `script.js` (`montarDashboard`) | 🟡 Média | Cartão "Contratos ativos" mostra **todos** os contratos |
| 4 | `script.js` (vários `innerHTML`) | 🟠 Alta c/ back-end real | Dados do servidor entram no HTML **sem escape** (risco de XSS) |
| 5 | `script.js` (busca) | 🟢 Baixa | Cada tecla digitada refaz as buscas (no modo real: requisições a cada tecla) |
| 6 | `script.js` (`submit` e `excluir`) | 🟢 Baixa | Se o servidor responder erro (ex.: `409`), o usuário **não vê nada** |
| 7 | `relatorios.js` (nome do arquivo) | 🟢 Baixa | Usa data em UTC (à noite sai o dia de amanhã) |
| 8 | `autenticacao.js` | ℹ️ Aviso | Token em `sessionStorage` é legível por JS |

### 🔴 Bug 1: o logout/proteção leva a uma página inexistente

```js
sair() {
  sessionStorage.removeItem(CHAVE_SESSAO);
  location.href = 'login.html';           // ← relativo à página ATUAL
},
exigirLogin() {
  if (!this.sessao()) location.replace('login.html');   // ← idem
},
```

Um caminho **sem barra no começo** é resolvido **a partir da pasta da página atual**:

| Você está em | `'login.html'` vira | Existe? |
|---|---|---|
| `/index.html` | `/login.html` | ✅ |
| `/templates/Cliente.html` | `/templates/login.html` | ❌ **404** |

Como o `login.html` fica na **raiz** (e as telas em `templates/`), clicar em **Sair** numa tela de cadastro, ou ter a sessão derrubada por um `401`, leva a uma página que não existe. **Conserto simples:** usar caminho absoluto (a partir da raiz do site):

```js
sair() {
  sessionStorage.removeItem(CHAVE_SESSAO);
  location.href = '/login.html';
},
exigirLogin() {
  if (!this.sessao()) location.replace('/login.html');
},
```

(Funciona no Live Server e no Spring Boot, que servem na raiz. Se um dia hospedar numa subpasta, como `usuario.github.io/projeto/`, o ideal é guardar o caminho do login numa constante no `config.js`.)

> Se na **sua** estrutura de pastas o `login.html` também está dentro de `templates/`, então o problema é o inverso (o `index.html` é que não acharia). O princípio é o mesmo: **caminhos relativos mudam conforme a página onde o código roda**.

### 🟡 Bug 2: item ativo do menu nunca acende

```js
const paginaAtual = location.pathname.split('/').pop() || 'index.html';   // 'Cliente.html'
... arquivo === paginaAtual ...    // '../templates/Cliente.html' === 'Cliente.html'  → sempre false
```

`LINKS_MENU` guarda o caminho **completo** (`'../templates/Cliente.html'`), mas `paginaAtual` é só o **nome do arquivo**. Nunca são iguais. **Conserto:**

```js
`<a href="${arquivo}" class="${arquivo.split('/').pop() === paginaAtual ? 'ativo' : ''}">${nome}</a>`
```

Pega só o último pedaço de `arquivo` antes de comparar.

### 🟡 Bug 3: "Contratos ativos" não filtra

Dentro de `atualizar()` você já calcula:

```js
const ativos = contratos.filter((c) => !c.dataFim || c.dataFim >= dataEmDias(0));   // calculada...
```

mas o cartão usa:

```js
['Contratos ativos', contratos.length, 'Contrato.html'],   // ← ...e não usada
```

A variável `ativos` **nunca é usada**. Troque `contratos.length` por `ativos.length`.

### 🟠 Bug 4: HTML sem "escape" (XSS)

O código monta HTML **colando textos** dentro de template literals. Hoje isso é inofensivo (os dados são seus). Mas, com o back-end real, **o texto vem de usuários**. Se alguém cadastrar um cliente chamado:

```
<img src=x onerror="alert('invadido')">
```

o navegador **executa** esse código ao desenhar a tabela. Isso é **XSS** (*Cross-Site Scripting*), e o ataque pode, por exemplo, **roubar o token** do `sessionStorage`.

**Teste você mesmo (modo teste):** cadastre um cliente com o nome `<b>teste</b>`. Se aparecer **em negrito** na tabela, o texto está sendo interpretado como HTML.

**Conserto:** uma função que "desativa" os caracteres especiais, aplicada em **todo** dado dinâmico que entra num `innerHTML`:

```js
const escaparHtml = (texto) => String(texto).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
```

Onde aplicar (principais): o texto devolvido por `celulaDaTabela`, os rótulos em `desenharBarras`, as células em `desenharTabelaResumo`, o `usuario.nome` no `montarMenu` e os textos das `<option>`. (Detalhe: aplique no **texto**, não no HTML que você mesmo monta, como o `<span class="selo ...">`.)

### 🟢 Melhorias menores

**5. Busca refaz tudo a cada tecla.** `caixaBusca.addEventListener('input', atualizarTabela)` chama `Repositorio.listar` e `carregarRotulos` (várias requisições no modo real) a **cada letra**. Ideias: guardar a lista em memória e só filtrar; ou esperar o usuário parar de digitar por ~300 ms (*debounce*).

**6. Erros silenciosos.** Se `Repositorio.salvar` ou `excluir` lançar erro (ex.: `409` ao excluir cliente com contratos), a janela já fechou e **nada aparece**; o erro fica só no console. Um `try/catch` com `alert(erro.message)` (ou uma mensagem na tela) resolve:

```js
try {
  await Repositorio.excluir(entidade.recurso, Number(excluir));
  await atualizarTabela();
} catch (erro) {
  alert(erro.message);
}
```

**7. Data do arquivo em UTC.** `new Date().toISOString().slice(0, 10)` usa **UTC**. No Brasil, depois das 21h o UTC já é "amanhã", então o PDF sai com a data do dia seguinte. Use o truque do `sv-SE` que você já usa em outros lugares: `new Date().toLocaleDateString('sv-SE')`.

**8. Token legível.** Qualquer script na página consegue ler o `sessionStorage`. Por isso o bug 4 (XSS) importa. Pra um projeto de faculdade, está ótimo; em produção séria, considera-se cookie `HttpOnly`.

**Extras pequenos:**
- `JSON.parse` em `lerConfiguracoes` e `lerLocal` não está em `try/catch` (diferente de `Autenticacao.sessao`). Se alguém corromper o `localStorage`, a página quebra.
- O `<h1 ... href="./static/img/logo.png">` no `montarMenu`: `href` **não existe** em `<h1>` (é ignorado). A logo vem do CSS (`mask`), então pode **remover** esse atributo.
- A proteção de login no front **não é segurança real** (seção 4.7): quem protege os dados é o back-end.

---

## 14. Glossário

| Termo | Significado simples |
|---|---|
| **API** | O "cardápio" de pedidos que o back-end aceita (URLs + o que cada uma faz) |
| **Async / await** | Jeito de esperar algo demorado sem travar a página |
| **Back-end** | A parte que roda no servidor e mexe no banco de dados |
| **Bubbling (propagação)** | O evento "sobe" do elemento clicado até seus "pais" |
| **Closure** | Função interna que "lembra" das variáveis da função onde nasceu |
| **CORS** | Regra do navegador que bloqueia sites de lerem respostas de outra origem sem permissão |
| **CRUD** | Create, Read, Update, Delete: criar, ler, editar, apagar |
| **DOM** | A versão "viva" do HTML dentro do navegador, que o JS manipula |
| **Data-driven** | Programar descrevendo com **dados** em vez de repetir código |
| **DRY** | *Don't Repeat Yourself*: não repita |
| **Early return** | Sair da função cedo quando um caso já foi resolvido |
| **Endpoint** | Uma URL específica da API (`GET /api/clientes`) |
| **Event delegation** | Um ouvinte no "pai" cuidando dos eventos dos "filhos" |
| **Falsy** | Valores que o `if` trata como falso: `false`, `0`, `''`, `null`, `undefined`, `NaN` |
| **Fetch** | Função do navegador pra fazer requisições HTTP |
| **Front-end** | A parte que roda no navegador (HTML, CSS, JS) |
| **Idempotente** | Pode rodar várias vezes e o resultado é o mesmo |
| **JSON** | Formato de texto pra trocar dados (`{"nome":"Maria"}`) |
| **JWT** | Token assinado que prova quem você é depois do login |
| **localStorage / sessionStorage** | Cofrinhos de texto do navegador (permanente / só da aba) |
| **MPA / SPA** | Várias páginas / uma página só |
| **Modal** | Janela que bloqueia o resto da tela até fechar |
| **Promise** | "Promessa" de um resultado que vai chegar |
| **REST** | Estilo de montar APIs: substantivo na URL, verbo no método HTTP |
| **Repository** | Camada que esconde de onde os dados vêm |
| **Seed** | Dados iniciais criados pra teste |
| **Spread (`...`)** | "Espalha" os itens de um objeto/lista dentro de outro |
| **Template literal** | Texto entre crases com `${}` |
| **XSS** | Ataque em que texto malicioso vira código executado na página |

---

## 15. Exercícios para fixar

> A melhor forma de entender é **mexer**. Cada exercício diz **onde** mexer. Faça no modo teste, com o F12 aberto.

### 15.0 Brincando no console (F12 → aba Console)

Como os scripts não usam módulos, **tudo que eles declaram fica acessível no console**. Teste:

```js
ENTIDADES                                  // veja a "receita" de tudo
ENTIDADES.clientes.campos.length           // quantos campos tem em clientes?
await Repositorio.listar('clientes')       // a lista de clientes
formatarMoeda(1234.5)                      // 'R$ 1.234,50'
formatarData('2026-11-14')                 // '14/11/2026'
formatarOpcao('EM_ANDAMENTO')              // 'em andamento'
contarPor([{ a: 'x' }, { a: 'y' }, { a: 'x' }], 'a')   // { x: 2, y: 1 }
dataEmDias(30)                             // a data daqui a 30 dias
Autenticacao.sessao()                      // quem está logado
```

E pra **ver o "banco"**: aba **Application** → **Local Storage** → você vê `arecologico_clientes`, `arecologico_contratos`... e a sessão em **Session Storage**.

### 15.1 Nível fácil

1. **Novo campo.** Adicione o campo `bairro` em clientes. *Onde:* **1 linha** em `ENTIDADES.clientes.campos`. Verifique: aparece no formulário? (E se colocar em `colunas`, na tabela?) E nos relatórios?
2. **Nova cor.** Adicione `vermelho` em `CORES_DE_DESTAQUE`. *Onde:* 1 linha em `configuracoes.js`. Abra o ⚙: ela apareceu sozinha?
3. **Top 10.** Faça os gráficos de barras mostrarem 10 itens em vez de 6. *Onde:* `desenharBarras`, o `.slice(0, 6)`.
4. **Cartão novo.** Adicione ao dashboard um cartão "OS concluídas" com a quantidade. *Onde:* a lista de cartões em `atualizar()` (`concluidas.length` já existe).

### 15.2 Nível médio

5. **Corrija o bug 3** (Contratos ativos) e o **bug 2** (menu ativo).
6. **Nova entidade.** Crie `fornecedores` (nome, telefone, cidade). *Onde:* um bloco em `ENTIDADES`; uma página `Fornecedor.html` copiando o `Cliente.html` com `data-entidade="fornecedores"`; um link em `LINKS_MENU`. Repare: **você não escreveu nenhuma lógica de CRUD.**
7. **Relatório novo.** Inclua `fornecedores` nos relatórios. *Onde:* **1 linha** em `CONFIGURACAO_RELATORIOS`.
8. **Corrija o bug 1** (caminho do login) e teste clicando em **Sair** numa tela dentro de `templates/`.

### 15.3 Nível desafio

9. **Escape de HTML.** Implemente o `escaparHtml` (bug 4) e teste com o nome `<b>teste</b>`.
10. **Mensagem de erro.** Faça o `salvar`/`excluir` mostrarem `erro.message` quando falharem (bug 6). Simule o erro apontando `URL_API` pra um endereço errado e `USAR_DADOS_FALSOS = false`.
11. **Busca nos nomes.** Faça a busca da tabela de contratos achar pelo **nome do cliente**. *Dica:* o `filtrados` hoje usa os valores brutos; você tem os `rotulos` à mão em `atualizarTabela`.
12. **Gráfico novo.** Crie "OS por cidade do cliente" no dashboard. *Dica:* você já tem `clienteDoContrato`; precisará de um `Map` contrato → cidade e usar `contarPor` + `desenharBarras`.

### 15.4 Roteiro de estudo sugerido

Pra não se afogar, leia **nesta ordem** (cada passo prepara o próximo):

1. `config.js` (2 linhas) → seção 3.
2. O `Repositorio` e o `requisitar` no `script.js` → seções 6.2 e 6.3. **É a base de tudo.**
3. `ENTIDADES` e `campo()` → seção 6.1.
4. `formatarCelula` + `carregarRotulos` → seção 6.5.
5. `iniciarTelaCrud` **função por função** → seção 6.6.
6. `autenticacao.js` → seção 4.
7. Dashboard → seção 6.7 (deixe pro final: é mais "volume" do que "conceito").
8. `configuracoes.js` e `relatorios.js` → seções 7 e 8.

> 💬 Não precisa entender tudo de uma vez. O código foi organizado em **pedacinhos pequenos que fazem uma coisa só**, justamente pra poder ser lido assim, um por vez. Quando bater a dúvida, volte na **seção 2** (mini-curso) e depois no **F12**. Testar é a melhor explicação. 🚀
