# AR Ecológico — Sistema de Gestão

Sistema web de gestão para a **AR Ecológico**, empresa de ar-condicionado de São José do Rio Preto (SP). Cadastro de clientes, contratos, equipamentos, ordens de serviço (OS), serviços e funcionários, com dashboard, relatórios em PDF, tela de login e configurações de acessibilidade.

O **front-end** é HTML + CSS + JavaScript puro (sem framework, sem build). O **back-end** será Java Spring Boot + SQL Server. Hoje o front roda sozinho com dados fictícios e está pronto para ser ligado à API (veja a [Parte 2](#parte-2--integração-com-o-back-end-spring-boot--sql-server)).

---

## Sumário

**Parte 1 — Front-end**
1. [Estrutura de pastas](#1-estrutura-de-pastas)
2. [Como rodar](#2-como-rodar)
3. [Páginas](#3-páginas)
4. [Arquivos JavaScript](#4-arquivos-javascript)
5. [Configurações e acessibilidade](#5-configurações-e-acessibilidade)
6. [Modelo de dados esperado pelo front](#6-modelo-de-dados-esperado-pelo-front)

**Parte 2 — Integração com o back-end (para o Pedro Afonso, o "Fomfom")**
7. [Visão geral da integração](#7-visão-geral-da-integração)
8. [Contrato da API](#8-contrato-da-api)
9. [Banco de dados SQL Server](#9-banco-de-dados-sql-server)
10. [Projeto Spring Boot](#10-projeto-spring-boot)
11. [Mapeamento front ↔ banco](#11-mapeamento-front--banco)
12. [Exemplo completo: Contratos](#12-exemplo-completo-contratos)
13. [Autenticação com JWT](#13-autenticação-com-jwt)
14. [CORS e como servir o front](#14-cors-e-como-servir-o-front)
15. [Endpoints opcionais do dashboard (views do banco)](#15-endpoints-opcionais-do-dashboard-views-do-banco)
16. [Ligando o front à API](#16-ligando-o-front-à-api)
17. [Testando](#17-testando)
18. [Checklist e pontos de atenção](#18-checklist-e-pontos-de-atenção)

---

# Parte 1 — Front-end

## 1. Estrutura de pastas

```
resources/
├── index.html                  # tela inicial (atalhos)
├── login.html                  # tela de login
├── application.properties      # configuração do Spring (back-end)
├── static/
│   ├── css/
│   │   └── style.css           # todo o visual (temas, responsividade, gráficos)
│   ├── img/
│   │   └── logo.png            # logo (PNG branco, fundo transparente)
│   └── js/
│       ├── config.js           # URL da API e chave liga/desliga dos dados fictícios
│       ├── autenticacao.js     # login, sessão e proteção das telas
│       ├── dados-exemplo.js    # dados fictícios (apagar ao integrar)
│       ├── script.js           # entidades, CRUD, menu, formatação e dashboard
│       ├── configuracoes.js    # botão ⚙ e janela de configurações
│       └── relatorios.js       # tela de relatórios em PDF
└── templates/
    ├── Cliente.html
    ├── Contrato.html           # contratos + equipamentos
    ├── Servico.html            # ordens de serviço + serviços
    ├── Funcionario.html
    ├── Dashboard.html
    └── Relatorio.html
```

A logo é aplicada por CSS (`mask` com `../img/logo.png`), por isso ela fica branca no arquivo e assume a cor do tema.

## 2. Como rodar

1. Abra a pasta no **VS Code** e instale a extensão **Live Server**.
2. Clique com o botão direito em `login.html` → *Open with Live Server* (porta **5500**).
3. Entre com o usuário de teste:
   - **E-mail:** `admin@arecologico.com`
   - **Senha:** `123456`

Enquanto `USAR_DADOS_FALSOS = true` (em `config.js`), tudo funciona offline: os dados ficam no `localStorage` do navegador e o login é validado no próprio front.

- **Resetar os dados de exemplo:** no navegador, F12 → *Application* → *Local Storage* → limpar (ou `localStorage.clear()` no console) e recarregar. Os dados só são recriados se a chave `arecologico_servicos-realizados` não existir.
- **A sessão** fica em `sessionStorage` (some ao fechar a aba).
- A página de **Relatórios** carrega jsPDF e AutoTable por CDN, então precisa de internet.

## 3. Páginas

Todas as telas (menos o login) montam o **menu lateral** automaticamente, exigem login e carregam o botão ⚙ de configurações. O menu tem: Início, Dashboard, Clientes, Contratos, Serviços / OS, Funcionários, Relatórios, além do nome do usuário e o botão **Sair**.

### 3.1 `login.html` — Entrar
- Formulário com e-mail e senha.
- Mensagens de erro: "E-mail ou senha incorretos.", "Servidor indisponível…" e "Não foi possível entrar agora…".
- A dica com o usuário de teste só aparece quando `USAR_DADOS_FALSOS = true`.
- Se já existe sessão, redireciona direto para `index.html`.
- É a única página marcada com `data-publica` no `<body>` (as demais redirecionam para o login se não houver sessão).

### 3.2 `index.html` — Início
Seis cartões de atalho: Clientes, Contratos e equipamentos, Serviços e ordens de serviço, Funcionários, Dashboard e Relatórios em PDF.

### 3.3 Telas de cadastro (CRUD)
`Cliente`, `Contrato`, `Servico` e `Funcionario` usam o mesmo motor: basta ter `<section data-entidade="nomeDaEntidade">` e o `script.js` constrói a tela inteira. Cada seção traz:

- **Busca** no topo, que procura o texto em qualquer campo do registro (filtra no navegador).
- **Botão "+ Novo"**, que abre uma janela (`<dialog>`) com o formulário.
- **Tabela** com as colunas principais e os botões **Editar** e **Excluir** (com confirmação).
- **Campos que dependem de outros:** CPF, RG, data de nascimento e e-mail só aparecem para pessoa física; CNPJ só para pessoa jurídica.
- **Selects ligados a outra entidade:** o contrato escolhe um cliente, o equipamento escolhe um contrato, a OS escolhe contrato e funcionário. As listas vêm da API (ou do `localStorage`).
- **Etiqueta colorida** para o status da OS (aberta, em andamento, concluída, cancelada).

| Página | Seções (`data-entidade`) | Colunas da tabela |
|---|---|---|
| **Cliente.html** | `clientes` | nome, tipo de cliente, telefone, cidade |
| **Contrato.html** | `contratos` e `equipamentos` | contratos: descrição, cliente, tipo, início, fim · equipamentos: marca, modelo, BTUs, contrato |
| **Servico.html** | `ordensServico` e `servicos` | OS: problema, contrato, funcionário, status, valor, abertura · serviços: descrição, valor, início, fim |
| **Funcionario.html** | `funcionarios` | nome, cargo, pagamento |

Os campos completos de cada formulário estão na [seção 6](#6-modelo-de-dados-esperado-pelo-front).

### 3.4 `Dashboard.html` — Dashboard
No topo há o seletor **Período das OS** (30 dias, 90 dias, 6 meses — padrão — ou todo o período). Ele filtra as OS pela data de abertura e atualiza tudo, **exceto** o gráfico de faturamento mensal, que sempre mostra os últimos 6 meses.

**Cartões**

| Cartão | O que mostra | View/função do banco equivalente |
|---|---|---|
| Clientes | total de clientes | `VW_PESSOAS_TOTAIS` |
| Contratos ativos | contratos sem data fim ou com data fim futura | `VW_CONTRATOS_TOTAIS_ATIVOS` |
| OS em aberto | OS abertas + em andamento no período | `VW_ORDEM_SERVICO_TOTAIS_ATIVOS` |
| Faturamento no período | soma das OS concluídas | `FN_FATURAMENTO_PERIODO` |
| Ticket médio por OS | faturamento ÷ OS concluídas | `FC_ORDEM_SERVICO_MEDIA` |
| Contratos vencendo em 30 dias | contratos com fim nos próximos 30 dias | — |

**Gráficos e tabelas**

| Bloco | Tipo | View do banco equivalente |
|---|---|---|
| Faturamento por mês (6 meses) | colunas | `FN_FATURAMENTO_PERIODO` (por mês) |
| OS por status | rosca | `VW_OS_POR_STATUS` |
| OS por tipo | barras | `VW_OS_POR_TIPO` |
| Formas de pagamento (OS concluídas) | rosca | — |
| Faturamento por funcionário | barras | — |
| Contratos por tipo | barras | — |
| Clientes por cidade | barras | — |
| Pessoa física e jurídica | rosca | `VW_PESSOAS_TOTAIS` |
| Últimas ordens de serviço | tabela (cliente, problema, funcionário, status, abertura, encerramento, valor) | `VW_ORDENS_SERVICO_PESSOAS` |
| Contratos vencendo em 30 dias | tabela | — |
| Equipamentos por contrato | barras | `VW_CONTRATOS_PESSOAS_EQUIPAMENTOS` |
| Pagamento por funcionário | barras | `VW_PAGAMENTO_PRESTADOR_SERVICO` |
| Faturamento líquido por serviço | barras | `VW_OS_SERVICOS_REALIZADOS` |

Hoje o dashboard **calcula tudo no navegador** a partir das listas que a API devolve (`GET /clientes`, `/contratos`, `/ordens-servico`, `/funcionarios`, `/equipamentos`, `/servicos`, `/servicos-realizados`). Ou seja, o back-end **não precisa** criar endpoints próprios para o dashboard funcionar. A [seção 15](#15-endpoints-opcionais-do-dashboard-views-do-banco) explica a alternativa usando as views.

Os gráficos são feitos só com HTML/CSS (barras com `div`, rosca com `conic-gradient`), sem biblioteca.

### 3.5 `Relatorio.html` — Relatórios em PDF
- Escolha o **tipo de relatório**: Ordens de Serviço, Contratos, Serviços, Equipamentos, Clientes ou Funcionários.
- **Período** (data inicial e final), disponível para OS (data de abertura), contratos e serviços (data de início). Nos demais tipos os campos ficam desativados.
- **Filtro extra**: status (OS), tipo de contrato (contratos) ou tipo de cliente (clientes).
- **Informações do relatório**: caixas de seleção para escolher quais colunas entram no PDF.
- O PDF sai com título, período, data/hora de geração, tabela, total de registros e total de cada coluna em dinheiro. Fica em paisagem quando tem mais de 5 colunas.
- Para criar um novo tipo de relatório, basta adicionar uma linha em `CONFIGURACAO_RELATORIOS` no `relatorios.js`.

## 4. Arquivos JavaScript

| Arquivo | Responsabilidade |
|---|---|
| `config.js` | Só duas constantes: `URL_API` (`http://localhost:8080/api`) e `USAR_DADOS_FALSOS`. É o único lugar para configurar a conexão. |
| `autenticacao.js` | Objeto `Autenticacao` (`entrar`, `sair`, `sessao`, `cabecalhos`, `exigirLogin`). Guarda `{ token, usuario }` no `sessionStorage` e envia `Authorization: Bearer <token>` em toda chamada. |
| `dados-exemplo.js` | `semearDadosDeExemplo()`: grava dados fictícios no `localStorage` (8 clientes, 5 funcionários, 8 contratos, 12 equipamentos, 36 OS, 4 serviços e 60 serviços realizados). **Apagar ao integrar.** |
| `script.js` | Cérebro do sistema: configuração das entidades (`ENTIDADES`), `Repositorio` (único ponto de acesso a dados), menu, formatação (moeda, data), motor de CRUD e dashboard. |
| `configuracoes.js` | Botão ⚙ fixo e janela de configurações; salva as escolhas no `localStorage`. |
| `relatorios.js` | Tela de relatórios (filtros, seleção de colunas, geração do PDF). |

**O `Repositorio` é o ponto de integração:** ele decide entre `localStorage` e API. Todo o resto do front só chama `Repositorio.listar`, `salvar` e `excluir`.

## 5. Configurações e acessibilidade

O botão **⚙** (canto da tela) abre a janela de configurações. As escolhas valem para todas as telas e ficam salvas no navegador:

- **Visual:** tema (claro/escuro), cor de destaque (verde, azul, laranja, roxo) e tamanho da letra (14 a 21 px).
- **Exibição:** densidade das tabelas (confortável/compacta), linhas alternadas e mostrar/ocultar o menu lateral.
- **Acessibilidade:** alto contraste, fonte de leitura facilitada, maior espaçamento entre linhas, destaque forte do foco do teclado e redução de animações.
- **Restaurar padrão** volta tudo ao original.

O CSS é responsivo (quebras em 380, 640, 900 e 1100 px): em telas pequenas as células das tabelas ganham o rótulo da coluna (`data-rotulo`) e os atalhos se reorganizam.

## 6. Modelo de dados esperado pelo front

Os nomes dos campos abaixo (camelCase) **são o JSON que o front lê e envia**. Campos vazios não são enviados (o front omite o campo, não manda `""`).

| Recurso (URL) | Campos |
|---|---|
| `clientes` | `id`, `tipoCliente`\*, `nome`\*, `cpf`, `rg`, `dataNascimento`, `email`, `cnpj`, `telefone`, `cep`, `endereco`, `numero`, `cidade`, `estado` |
| `funcionarios` | `id`, `nome`\*, `cargo`, `pagamento` |
| `contratos` | `id`, `clienteId`\*, `descricao`\*, `tipoContrato`, `dataInicio`, `dataFim` |
| `equipamentos` | `id`, `contratoId`\*, `marca`, `modelo`, `btus` |
| `ordens-servico` | `id`, `contratoId`\*, `funcionarioId`, `tipoOs`, `status`\*, `tipoPagamento`, `valor`, `dataAbertura`, `dataExecucao`, `descricaoProblema`\*, `descricaoExecutado`, `obs` |
| `servicos` | `id`, `descricao`\*, `valorServico`, `dataInicio`, `dataFim`, `obs` |
| `servicos-realizados` | `id`, `osId`, `servicoId`, `qtd`, `valor`, `desconto` *(só leitura pelo dashboard)* |

\* obrigatório no formulário.

**Valores fixos (enums), sempre em MAIÚSCULAS e exatamente assim:**

| Campo | Valores |
|---|---|
| `tipoCliente` | `FISICA`, `JURIDICA` |
| `tipoContrato` | `PMOC`, `MANUTENCAO_PREVENTIVA`, `INSTALACAO`, `OUTRO` |
| `tipoOs` | `INSTALACAO`, `MANUTENCAO`, `LIMPEZA`, `REPARO` |
| `status` (OS) | `ABERTA`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA` |
| `tipoPagamento` | `PIX`, `DINHEIRO`, `CARTAO`, `BOLETO` |

---

# Parte 2 — Integração com o back-end (Spring Boot + SQL Server)

> **Fomfom, este guia é pra você.** Aqui está tudo que o front espera da API e um caminho passo a passo para montar o back-end. Os trechos de código são pontos de partida, adapte ao seu jeito. As colunas do banco que aparecem aqui foram tiradas do arquivo `Ideias_Funciton_Viws.sql`; confira com o DER oficial antes de mapear (principalmente os itens marcados com ⚠️).

## 7. Visão geral da integração

```
 Navegador (HTML/CSS/JS)  ──HTTP/JSON──►  Spring Boot (/api/...)  ──JDBC──►  SQL Server (bd_ar)
   Repositorio (script.js)                 Controller → Service → Repository
   Authorization: Bearer <JWT>             Spring Security + JWT                Tabelas, views e funções
```

O que o front espera, em resumo:

1. API REST em `http://localhost:8080/api` devolvendo e recebendo **JSON em camelCase**.
2. Quatro operações por recurso: listar, criar, editar e excluir.
3. Login que devolve um **JWT**; todas as outras rotas exigem o token.
4. **CORS** liberado para o front (porta 5500 em desenvolvimento).

O front **não faz paginação** nem busca por id: ele lista tudo e filtra no navegador. Por isso `GET /recurso` precisa devolver **todos** os registros, num array simples.

## 8. Contrato da API

URL base: `http://localhost:8080/api` (definida em `config.js`).

### Recursos CRUD

Vale para `clientes`, `funcionarios`, `contratos`, `equipamentos`, `ordens-servico` e `servicos`:

| Operação | Requisição | Resposta esperada |
|---|---|---|
| Listar | `GET /api/{recurso}` | `200` + array JSON com **todos** os registros |
| Criar | `POST /api/{recurso}` (corpo sem `id`) | `201` (ou `200`) + objeto salvo, já com `id` |
| Editar | `PUT /api/{recurso}/{id}` (corpo com `id`) | `200` + objeto salvo |
| Excluir | `DELETE /api/{recurso}/{id}` | `204` sem corpo |

E mais: `GET /api/servicos-realizados` (só leitura, usado no dashboard) e `POST /api/auth/login`.

### Regras de formato (importantes!)

| Item | Regra |
|---|---|
| Nomes dos campos | camelCase, exatamente como na [seção 6](#6-modelo-de-dados-esperado-pelo-front) |
| Datas | texto `yyyy-MM-dd` (ex.: `"2026-11-13"`). O front **compara datas como texto** (`>=`), então não mande hora nem formato `dd/MM/yyyy`. |
| Dinheiro (`valor`, `pagamento`, `valorServico`, `desconto`) | **número** JSON (`350.5`), nunca texto |
| `id` e chaves estrangeiras (`clienteId`, `contratoId`…) | número |
| Enums | texto em maiúsculas conforme a tabela da seção 6. O status da OS no banco é número (1 a 4), então **converta no back-end**. |
| Campos opcionais | podem chegar ausentes no `POST/PUT` e podem vir `null` ou ausentes no `GET` (o front mostra `-`) |
| Edição | o front manda `id` no corpo **e** na URL |

### Códigos de erro (cuidado com o 401)

- **`401` só para "não autenticado"** (sem token, token inválido/expirado, senha errada). **Quando o front recebe 401 em qualquer chamada, ele apaga a sessão e manda o usuário para o login.** Se você devolver 401 por erro de negócio, o usuário será deslogado.
- `400` para validação (campo obrigatório vazio), `404` para registro inexistente, `409` para exclusão bloqueada por chave estrangeira (ex.: cliente com contratos).
- Hoje o front só mostra um erro genérico (`Erro 409 em DELETE /clientes/3`). Se você devolver uma mensagem clara no corpo, dá para exibir depois.

### Login

```
POST /api/auth/login
{ "email": "admin@arecologico.com", "senha": "123456" }

200 -> { "token": "<JWT>", "usuario": { "id": 1, "nome": "Administrador", "email": "admin@arecologico.com", "perfil": "ADMIN" } }
401 -> e-mail ou senha incorretos
```

Depois disso, toda chamada leva o cabeçalho `Authorization: Bearer <token>`.

## 9. Banco de dados SQL Server

Nome do banco usado no script de ideias: **`bd_ar`**.

### 9.1 Preparar o SQL Server

1. Instale o **SQL Server** e o **SSMS** (Management Studio).
2. No **SQL Server Configuration Manager** → *Protocolos de Rede* → ative **TCP/IP** (porta **1433**) e reinicie o serviço.
3. No SSMS, clique com o botão direito no servidor → *Propriedades* → *Segurança* → habilite **Modo de Autenticação do SQL Server e do Windows**. Reinicie o serviço.
4. Crie um usuário só para a aplicação (não use o `sa`):

```sql
CREATE LOGIN arecologico_app WITH PASSWORD = 'TroqueEstaSenha!123';
GO
USE bd_ar;
GO
CREATE USER arecologico_app FOR LOGIN arecologico_app;
ALTER ROLE db_datareader ADD MEMBER arecologico_app;
ALTER ROLE db_datawriter ADD MEMBER arecologico_app;
GRANT EXECUTE TO arecologico_app;   -- para chamar as funções (FN_/FC_)
GO
```

### 9.2 Tabela de usuários (login)

O script atual **não tem tabela de usuários**. Crie uma:

```sql
CREATE TABLE USUARIOS (
    COD_USUARIO INT IDENTITY(1,1) PRIMARY KEY,
    NOME        VARCHAR(100) NOT NULL,
    EMAIL       VARCHAR(150) NOT NULL UNIQUE,
    SENHA_HASH  VARCHAR(100) NOT NULL,          -- hash BCrypt, NUNCA a senha pura
    PERFIL      VARCHAR(20)  NOT NULL DEFAULT 'ADMIN'
);
```

Para criar o primeiro usuário, gere o hash BCrypt pela própria aplicação (veja a [seção 13](#13-autenticação-com-jwt)).

### 9.3 Cuidados com o arquivo `Ideias_Funciton_Viws.sql`

> ⚠️ **Não execute o arquivo inteiro de uma vez.** Ele tem um `DROP DATABASE [bd_ar]` no meio e vários `DROP VIEW` soltos.

Problemas encontrados que vão dar erro ou resultado errado:

| Onde | Problema | Correção |
|---|---|---|
| `VW_OS_POR_STATUS` | está criada **duas vezes** (a segunda dá "já existe") | ficar só com a segunda versão |
| `VW_ORDEM_SERVICO_TOTAIS_ATIVOS` | `COUNT(OS.COD_OS)` sem apelido: o SQL Server não cria view com coluna sem nome | `COUNT(OS.COD_OS) AS TOTAL_OS_ATIVAS` |
| `VW_ORDEM_SERVICO_TOTAIS_ATIVOS` | conta só `STATUS = 1`, mas o card "OS em aberto" do front conta 1 e 2 | decidir a regra e igualar os dois lados |
| `VW_ORDENS_SERVICO_PESSOAS` | o join de `PJ` usa `OS.PESSOA_F_COD`; o certo é `OS.PESSOA_J_COD` (CNPJ nunca aparece) | trocar a coluna no `ON` |
| `VW_ORDENS_SERVICO_PESSOAS` e `VW_OS_SERVICOS_REALIZADOS` | o `CASE` do status não tem o valor `4` (cancelada), que vira `NULL` | `WHEN 4 THEN 'CANCELADA'` |

Sugestão: separar em arquivos (`01_tabelas.sql`, `02_views.sql`, `03_funcoes.sql`) e guardar no repositório do back-end.

## 10. Projeto Spring Boot

Sugestão: **Java 17+**, **Spring Boot 3.x**, **Maven**. O `application.properties` atual só tem `spring.application.name=demo`.

### 10.1 Dependências (`pom.xml`)

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <!-- Driver do SQL Server -->
    <dependency>
        <groupId>com.microsoft.sqlserver</groupId>
        <artifactId>mssql-jdbc</artifactId>
        <scope>runtime</scope>
    </dependency>
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.6</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.6</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.6</version>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

### 10.2 `application.properties`

```properties
spring.application.name=demo
server.port=8080

# --- SQL Server ---
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=bd_ar;encrypt=true;trustServerCertificate=true
spring.datasource.username=arecologico_app
spring.datasource.password=${DB_SENHA}
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver

# --- JPA: o banco JÁ EXISTE, o Hibernate não deve mexer nele ---
spring.jpa.hibernate.ddl-auto=none
spring.jpa.open-in-view=false
spring.jpa.show-sql=true

# --- JWT ---
arecologico.jwt.segredo=${JWT_SEGREDO}
arecologico.jwt.horas-validade=8
```

- **Nunca** deixe `ddl-auto=update` ou `create` apontando para o banco real: o Hibernate pode criar/alterar tabelas por conta própria.
- Senha do banco e segredo do JWT via **variáveis de ambiente** (`DB_SENHA`, `JWT_SEGREDO`), sem escrever no arquivo que vai para o GitHub. O segredo do JWT precisa ter **32 caracteres ou mais**.
- Se o `trustServerCertificate=true` incomodar em produção, instale um certificado válido no SQL Server.

### 10.3 Organização sugerida dos pacotes

```
com.arecologico.api
├── seguranca/     # SegurancaConfig, FiltroJwt, JwtServico, CorsConfig
├── auth/          # AuthController, LoginRequisicao, UsuarioEntity, UsuarioRepository
├── cliente/       # ClienteController, ClienteService, ClienteDto, entidades PF/PJ
├── contrato/      # ContratoController, ContratoService, ContratoDto, ContratoEntity ...
├── equipamento/
├── ordemservico/
├── servico/
├── funcionario/
├── dashboard/     # (opcional) endpoints das views
└── erro/          # TratadorDeErros (@RestControllerAdvice)
```

Regra de ouro: **o Controller nunca devolve a entidade JPA, e sim um DTO** (`record`). O DTO é o que garante o JSON camelCase que o front espera e permite converter coisas como status `1` ↔ `"ABERTA"`.

## 11. Mapeamento front ↔ banco

Baseado nas colunas que aparecem no `.sql`. ⚠️ = confirmar no DER.

| Recurso do front | Tabela(s) do banco | Observações |
|---|---|---|
| `clientes` | `PESSOAS` + `PESSOAS_FISICAS` **ou** `PESSOAS_JURIDICAS` | Um "cliente" no front é a junção de duas tabelas. `id` = `COD_PESSOA`. Ver 11.1. |
| `funcionarios` | `PRESTADOR_SERVICOS` + `PESSOAS` | `nome` vem de `PESSOAS.NOME`; `pagamento` de `PRESTADOR_SERVICOS.PAGAMENTO`; `id` = `PRESTADOR_COD`. ⚠️ O front tem `cargo`: não aparece no script, confirmar se existe coluna. |
| `contratos` | `CONTRATOS` | `clienteId` = o que estiver preenchido entre `COD_PESSOA_FISICA` e `COD_PESSOA_JURIDICA`. A view usa também `STATUS` (1 = ativo). |
| `equipamentos` | `EQUIPAMENTOS` + `CONTRATOS_EQUIPAMENTOS` | ⚠️ No banco a relação é N:N com `QTD`; no front, cada equipamento tem **um** `contratoId`. Ver 11.2. |
| `ordens-servico` | `ORDENS_SERVICOS` | ⚠️ No banco a OS aponta para a pessoa (`PESSOA_F_COD`/`PESSOA_J_COD`) e para `PRESTADOR_SERVICO_COD`; o front trabalha com `contratoId`. Ver 11.3. |
| `servicos` | `SERVICOS` | `COD_SERVICO`, `DESCRICAO`. ⚠️ `valorServico`, `dataInicio`, `dataFim`, `obs`: confirmar colunas. |
| `servicos-realizados` | `SERVICOS_REALIZADOS` | `OS_COD` → `osId`, `SERVICO_COD` → `servicoId`, `QTD`, `VALOR`, `DESCONTO`. |

### 11.1 Clientes (PF e PJ)

No `POST /clientes`, o `tipoCliente` define o que gravar, **na mesma transação** (`@Transactional`):

1. Insere em `PESSOAS` (`nome`, `endereco`, `numero`, `cep`, `cidade`, `estado`, `telefone`, `email`).
2. Se `FISICA`: insere em `PESSOAS_FISICAS` (`cpf`, `rg`, `dataNascimento`) usando o `COD_PESSOA` gerado.
3. Se `JURIDICA`: insere em `PESSOAS_JURIDICAS` (`cnpj`, e `RAZAO_SOCIAL`).

No `GET`, monte o DTO juntando as tabelas. Em pessoa jurídica o front só tem o campo `nome` ("Nome / Razão social"): decidam se `nome` também preenche `RAZAO_SOCIAL`. Como o front só mostra e-mail para pessoa física, o `email` da pessoa jurídica chega vazio.

No `PUT`, não permita trocar `tipoCliente` de um cliente que já tem contratos. O `DELETE` precisa apagar PF/PJ antes de `PESSOAS`, e falha com `409` se houver contratos ou OS ligados.

### 11.2 Equipamentos

O jeito mais simples de casar com o front: para cada linha de `CONTRATOS_EQUIPAMENTOS`, devolver um objeto `{ id, contratoId, marca, modelo, btus }`. Se o contrato tem `QTD = 3` do mesmo equipamento, a `VW_CONTRATOS_PESSOAS_EQUIPAMENTOS` já soma isso; no JSON simples do CRUD basta repetir a linha ou combinar com o Gabriel de adicionar um campo `qtd`.

### 11.3 Ordens de serviço

A conta que o dashboard faz precisa de `contratoId` (é por ele que o front descobre cliente e contrato da OS). Duas saídas:

- **Recomendada:** adicionar a coluna `CONTRATO_COD` (FK para `CONTRATOS`, aceita `NULL`) em `ORDENS_SERVICOS` e expor como `contratoId`. O mesmo vale para `TIPO_PAGAMENTO` e `OBS`, se não existirem.
- **Alternativa:** manter o banco como está e fazer o front trabalhar com `clienteId` em vez de `contratoId` (aí o Gabriel altera o front).

Conversão do `STATUS`:

| Banco | JSON |
|---|---|
| `1` | `ABERTA` |
| `2` | `EM_ANDAMENTO` |
| `3` | `CONCLUIDA` |
| `4` | `CANCELADA` |

Faça isso com um `enum` Java com o número e o texto. Não deixe o `4` sem tratamento: o front tem etiqueta e cor para `CANCELADA`.

## 12. Exemplo completo: Contratos

É um "fatiador" completo (Entity → Repository → DTO → Service → Controller). Os outros recursos seguem o mesmo molde. ⚠️ confirme os nomes das colunas.

### Entity

```java
@Entity
@Table(name = "CONTRATOS")
public class ContratoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)   // coluna IDENTITY do SQL Server
    @Column(name = "COD_CONTRATO")
    private Long id;

    @Column(name = "COD_PESSOA_FISICA")
    private Long codPessoaFisica;

    @Column(name = "COD_PESSOA_JURIDICA")
    private Long codPessoaJuridica;

    @Column(name = "TIPO_CONTRATO")
    private String tipoContrato;

    @Column(name = "DESCRICAO")
    private String descricao;

    @Column(name = "DATA_INICIO")
    private LocalDate dataInicio;

    @Column(name = "DATA_FIM")
    private LocalDate dataFim;

    @Column(name = "STATUS")
    private Integer status;

    // getters e setters
}
```

### Repository

```java
public interface ContratoRepository extends JpaRepository<ContratoEntity, Long> { }
```

### DTO (é o JSON que o front enxerga)

```java
public record ContratoDto(
        Long id,
        @NotNull Long clienteId,
        @NotBlank String descricao,
        String tipoContrato,
        LocalDate dataInicio,
        LocalDate dataFim) { }
```

O Jackson do Spring Boot já devolve `LocalDate` como `"2026-11-13"` (confirme que `spring.jackson.serialization.write-dates-as-timestamps` **não** está ligado).

### Service

```java
@Service
public class ContratoService {

    private final ContratoRepository contratos;
    private final PessoaFisicaRepository pessoasFisicas;   // para saber se o clienteId é PF ou PJ

    public ContratoService(ContratoRepository contratos, PessoaFisicaRepository pessoasFisicas) {
        this.contratos = contratos;
        this.pessoasFisicas = pessoasFisicas;
    }

    public List<ContratoDto> listar() {
        return contratos.findAll().stream().map(this::paraDto).toList();
    }

    @Transactional
    public ContratoDto salvar(Long id, ContratoDto dto) {
        ContratoEntity entidade = (id == null)
                ? new ContratoEntity()
                : contratos.findById(id).orElseThrow(() -> new NoSuchElementException("Contrato não encontrado"));

        boolean pessoaFisica = pessoasFisicas.existsById(dto.clienteId());
        entidade.setCodPessoaFisica(pessoaFisica ? dto.clienteId() : null);
        entidade.setCodPessoaJuridica(pessoaFisica ? null : dto.clienteId());
        entidade.setDescricao(dto.descricao());
        entidade.setTipoContrato(dto.tipoContrato());
        entidade.setDataInicio(dto.dataInicio());
        entidade.setDataFim(dto.dataFim());
        if (entidade.getStatus() == null) entidade.setStatus(1);   // novo contrato nasce ativo

        return paraDto(contratos.save(entidade));
    }

    @Transactional
    public void excluir(Long id) {
        contratos.deleteById(id);
    }

    private ContratoDto paraDto(ContratoEntity e) {
        Long clienteId = e.getCodPessoaFisica() != null ? e.getCodPessoaFisica() : e.getCodPessoaJuridica();
        return new ContratoDto(e.getId(), clienteId, e.getDescricao(), e.getTipoContrato(), e.getDataInicio(), e.getDataFim());
    }
}
```

### Controller

```java
@RestController
@RequestMapping("/api/contratos")
public class ContratoController {

    private final ContratoService servico;

    public ContratoController(ContratoService servico) { this.servico = servico; }

    @GetMapping
    public List<ContratoDto> listar() { return servico.listar(); }

    @PostMapping
    public ResponseEntity<ContratoDto> criar(@Valid @RequestBody ContratoDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servico.salvar(null, dto));
    }

    @PutMapping("/{id}")
    public ContratoDto atualizar(@PathVariable Long id, @Valid @RequestBody ContratoDto dto) {
        return servico.salvar(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        servico.excluir(id);
        return ResponseEntity.noContent().build();   // 204
    }
}
```

### Tratador de erros (evita 500 e o 401 indevido)

```java
@RestControllerAdvice
public class TratadorDeErros {

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> naoEncontrado(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> invalido(MethodArgumentNotValidException e) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", "Há campos obrigatórios vazios."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> emUso(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("mensagem", "Registro em uso por outro cadastro e não pode ser excluído."));
    }
}
```

## 13. Autenticação com JWT

### Serviço do token

```java
@Service
public class JwtServico {

    private final SecretKey chave;
    private final long horasValidade;

    public JwtServico(@Value("${arecologico.jwt.segredo}") String segredo,
                      @Value("${arecologico.jwt.horas-validade}") long horasValidade) {
        this.chave = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
        this.horasValidade = horasValidade;
    }

    public String gerar(UsuarioEntity usuario) {
        Date agora = new Date();
        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim("perfil", usuario.getPerfil())
                .issuedAt(agora)
                .expiration(new Date(agora.getTime() + horasValidade * 3_600_000L))
                .signWith(chave)
                .compact();
    }

    public String lerEmail(String token) {
        return Jwts.parser().verifyWith(chave).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }
}
```

### Filtro que lê o cabeçalho `Authorization`

```java
@Component
public class FiltroJwt extends OncePerRequestFilter {

    private final JwtServico jwt;

    public FiltroJwt(JwtServico jwt) { this.jwt = jwt; }

    @Override
    protected void doFilterInternal(HttpServletRequest requisicao, HttpServletResponse resposta, FilterChain cadeia)
            throws ServletException, IOException {
        String cabecalho = requisicao.getHeader("Authorization");
        if (cabecalho != null && cabecalho.startsWith("Bearer ")) {
            try {
                String email = jwt.lerEmail(cabecalho.substring(7));
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(email, null, List.of()));
            } catch (JwtException | IllegalArgumentException e) {
                // token inválido ou expirado: segue sem autenticar -> o Spring responde 401
            }
        }
        cadeia.doFilter(requisicao, resposta);
    }
}
```

### Configuração de segurança

```java
@Configuration
@EnableWebSecurity
public class SegurancaConfig {

    @Bean
    SecurityFilterChain filtros(HttpSecurity http, FiltroJwt filtroJwt) throws Exception {
        http.csrf(csrf -> csrf.disable())                        // API com token, sem cookie de sessão
            .cors(Customizer.withDefaults())                     // usa o CorsConfigurationSource da seção 14
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()   // pré-requisição do navegador (CORS)
                .requestMatchers("/api/auth/login").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(e -> e.authenticationEntryPoint(
                (req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))   // 401, não 403
            .addFilterBefore(filtroJwt, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder codificadorDeSenha() { return new BCryptPasswordEncoder(); }
}
```

### Login

```java
public record LoginRequisicao(@NotBlank String email, @NotBlank String senha) { }

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder codificador;
    private final JwtServico jwt;

    // construtor omitido

    @PostMapping("/login")
    public Map<String, Object> entrar(@Valid @RequestBody LoginRequisicao corpo) {
        UsuarioEntity usuario = usuarios.findByEmail(corpo.email())
                .filter(u -> codificador.matches(corpo.senha(), u.getSenhaHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos."));

        return Map.of(
                "token", jwt.gerar(usuario),
                "usuario", Map.of("id", usuario.getId(), "nome", usuario.getNome(),
                                  "email", usuario.getEmail(), "perfil", usuario.getPerfil()));
    }
}
```

### Criando o primeiro usuário

Como a senha precisa de hash BCrypt, o jeito mais fácil é um `CommandLineRunner` que cria o admin se a tabela estiver vazia:

```java
@Bean
CommandLineRunner criarAdmin(UsuarioRepository usuarios, PasswordEncoder codificador) {
    return args -> {
        if (usuarios.count() == 0) {
            usuarios.save(new UsuarioEntity("Administrador", "admin@arecologico.com",
                                            codificador.encode("TroqueEstaSenha"), "ADMIN"));
        }
    };
}
```

Troque a senha de teste antes de colocar o sistema em uso real.

## 14. CORS e como servir o front

Existem dois jeitos de ligar o front ao back-end. Escolha um.

### Opção A — Front separado (Live Server, porta 5500) → precisa de CORS

Durante o desenvolvimento, o front roda em `http://127.0.0.1:5500` e a API em `http://localhost:8080`. São origens diferentes, então o navegador bloqueia as chamadas se a API não liberar CORS:

```java
@Configuration
public class CorsConfig {

    @Bean
    CorsConfigurationSource configuracaoCors() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://127.0.0.1:5500", "http://localhost:5500"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource fonte = new UrlBasedCorsConfigurationSource();
        fonte.registerCorsConfiguration("/api/**", config);
        return fonte;
    }
}
```

Erro clássico: no console do navegador aparece *"blocked by CORS policy"* ou *"Response to preflight request doesn't pass"*. Quase sempre é porque faltou `OPTIONS` liberado na segurança, o cabeçalho `Authorization` na lista ou a origem exata (`127.0.0.1` ≠ `localhost`).

### Opção B — Front dentro do Spring Boot (um só servidor) → sem CORS

O Spring serve arquivos que estiverem em `src/main/resources/static/`. A pasta `templates/` **não é servida** como arquivo estático (ela é para o Thymeleaf), e um `index.html` solto em `resources/` também não. Para o front funcionar dentro do Spring sem mudar nenhum caminho dos HTML, a estrutura precisa ficar assim:

```
src/main/resources/static/
├── index.html
├── login.html
├── static/
│   ├── css/style.css
│   ├── img/logo.png
│   └── js/ ...
└── templates/
    ├── Cliente.html ... Relatorio.html
```

Com isso, `http://localhost:8080/login.html` abre o sistema, e os caminhos `../static/css/style.css` das páginas resolvem corretamente. Nesse caso, em `config.js` use `const URL_API = '/api';` (mesma origem, sem CORS).

## 15. Endpoints opcionais do dashboard (views do banco)

**Não é obrigatório.** Hoje o dashboard calcula tudo no navegador. Mas, se quiserem que o banco faça as contas (que é o objetivo das views e funções), o back-end pode expor os endpoints abaixo e o Gabriel troca o cálculo local por essas chamadas. Combinem antes para não fazer em duplicidade.

| Endpoint sugerido | Origem no banco | JSON sugerido |
|---|---|---|
| `GET /api/dashboard/os-por-status` | `VW_OS_POR_STATUS` | `{ "total": 36, "abertas": 6, "emAndamento": 6, "concluidas": 18, "canceladas": 6 }` |
| `GET /api/dashboard/os-por-tipo` | `VW_OS_POR_TIPO` | `[ { "tipoOs": "LIMPEZA", "qtd": 9 }, ... ]` |
| `GET /api/dashboard/clientes-totais` | `VW_PESSOAS_TOTAIS` | `{ "fisicas": 4, "juridicas": 4, "total": 8 }` |
| `GET /api/dashboard/contratos-ativos` | `VW_CONTRATOS_TOTAIS_ATIVOS` | `{ "total": 3 }` |
| `GET /api/dashboard/os-ativas` | `VW_ORDEM_SERVICO_TOTAIS_ATIVOS` | `{ "total": 6 }` |
| `GET /api/dashboard/faturamento?inicio=2026-06-01&fim=2026-11-13` | `dbo.FN_FATURAMENTO_PERIODO` | `{ "faturamento": 12345.50 }` |
| `GET /api/dashboard/ticket-medio?inicio=...&fim=...` | `FC_ORDEM_SERVICO_MEDIA` | `{ "ticketMedio": 685.86 }` |
| `GET /api/dashboard/equipamentos-por-contrato` | `VW_CONTRATOS_PESSOAS_EQUIPAMENTOS` | `[ { "contrato": "...", "qtdTotal": 3 }, ... ]` |
| `GET /api/dashboard/pagamento-funcionarios` | `VW_PAGAMENTO_PRESTADOR_SERVICO` | `[ { "nome": "Rafael Costa", "pagamento": 2500 }, ... ]` |
| `GET /api/dashboard/faturamento-servicos` | `VW_OS_SERVICOS_REALIZADOS` (soma de `VALOR_LIQUIDO` por serviço) | `[ { "servico": "Limpeza completa", "valorLiquido": 3200 }, ... ]` |
| `GET /api/dashboard/ultimas-os` | `VW_ORDENS_SERVICO_PESSOAS` | `[ { "cliente": "...", "problema": "...", "funcionario": "...", "status": "ABERTA", "dataAbertura": "...", "dataEncerramento": null, "valor": 480 }, ... ]` |

Exemplo de como consumir views e funções com `JdbcTemplate` (sem criar entidade JPA):

```java
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final JdbcTemplate jdbc;

    public DashboardController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/os-por-tipo")
    public List<Map<String, Object>> osPorTipo() {
        return jdbc.queryForList("SELECT TIPO_OS AS tipoOs, QTD AS qtd FROM VW_OS_POR_TIPO");
    }

    @GetMapping("/faturamento")
    public Map<String, Object> faturamento(@RequestParam(required = false) LocalDate inicio,
                                           @RequestParam(required = false) LocalDate fim) {
        BigDecimal total = jdbc.queryForObject(
                "SELECT dbo.FN_FATURAMENTO_PERIODO(?, ?)", BigDecimal.class, inicio, fim);
        return Map.of("faturamento", total);
    }
}
```

> Se usarem `FC_ORDEM_SERVICO_MEDIA` e `FC_TOTAL_OS` (funções escalares), chame sempre com o prefixo do esquema (`dbo.`) — no SQL Server, função escalar sem o `dbo.` dá erro.

## 16. Ligando o front à API

Depois que a API estiver no ar, são só três mudanças no front:

1. **`config.js`**
   ```js
   const URL_API = 'http://localhost:8080/api';   // ou '/api' se servir o front pelo Spring (opção B)
   const USAR_DADOS_FALSOS = false;
   ```
2. **Remover `dados-exemplo.js`** e a linha `<script src="...dados-exemplo.js"></script>` de **todas** as páginas: `index.html`, `Cliente.html`, `Contrato.html`, `Dashboard.html`, `Funcionario.html`, `Relatorio.html`, `Servico.html`. (O `script.js` já verifica se a função existe antes de chamar, então não quebra.)
3. **Limpar o navegador** (`localStorage` e `sessionStorage`) para não sobrar dado fictício nem sessão de teste.

Com `USAR_DADOS_FALSOS = false`, o login deixa de usar o usuário de teste e passa a chamar `POST /auth/login`.

## 17. Testando

Teste a API **antes** de abrir o front, com Postman, Insomnia ou `curl`:

```bash
# 1) login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arecologico.com","senha":"TroqueEstaSenha"}'

# 2) listar contratos (cole o token recebido)
curl http://localhost:8080/api/contratos -H "Authorization: Bearer COLE_O_TOKEN"

# 3) criar
curl -X POST http://localhost:8080/api/contratos \
  -H "Authorization: Bearer COLE_O_TOKEN" -H "Content-Type: application/json" \
  -d '{"clienteId":1,"descricao":"Manutenção - Teste","tipoContrato":"PMOC","dataInicio":"2026-11-13","dataFim":"2027-11-13"}'

# 4) sem token -> precisa dar 401
curl -i http://localhost:8080/api/contratos
```

Depois, com o front aberto, use o **F12 → aba Network** e olhe cada chamada: status, URL e o JSON de resposta. Se a tela não carregar, o erro quase sempre aparece ali ou no *Console*.

## 18. Checklist e pontos de atenção

**Checklist da integração**

- [ ] SQL Server com TCP/IP na porta 1433 e autenticação mista ativas
- [ ] Banco `bd_ar` criado, scripts rodados **separadamente** (sem o `DROP DATABASE`)
- [ ] Tabela `USUARIOS` criada e usuário admin gerado com BCrypt
- [ ] `application.properties` com datasource do SQL Server e `ddl-auto=none`
- [ ] `DB_SENHA` e `JWT_SEGREDO` como variáveis de ambiente
- [ ] CRUD de `clientes`, `funcionarios`, `contratos`, `equipamentos`, `ordens-servico` e `servicos`
- [ ] `GET /api/servicos-realizados` (o dashboard usa)
- [ ] Datas em `yyyy-MM-dd`, dinheiro como número, enums em maiúsculas, status da OS convertido de 1–4
- [ ] `401` somente para falta de autenticação; `409` para exclusão bloqueada
- [ ] CORS liberado para `http://127.0.0.1:5500` e `http://localhost:5500` (ou front servido pelo Spring)
- [ ] `config.js` com `USAR_DADOS_FALSOS = false` e `dados-exemplo.js` removido das 7 páginas

**Pontos de atenção (conversar com o Gabriel)**

1. **Sem paginação:** o front espera a lista inteira. Se adicionarem paginação, o front precisa mudar.
2. **`contratoId` na OS** e **`cargo` do funcionário** (itens ⚠️ da seção 11) dependem do DER oficial.
3. **Erros:** o front mostra mensagem genérica. Mensagens claras no corpo (`{"mensagem": "..."}`) permitem melhorar isso depois.
4. **Perfis de acesso:** o login já devolve `perfil` (`ADMIN`), mas o front ainda não restringe telas por perfil.

---

Projeto acadêmico (Fatec Rio Preto) desenvolvido para a AR Ecológico, de São José do Rio Preto.
Front-end: Gabriel · Back-end: Pedro Afonso ("Fomfom").
