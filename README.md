# Caderneta

Controle financeiro pessoal com cara de caderno de contas: papel creme, tinta azul, linhas pautadas e valores alinhados em coluna (fontes IBM Plex: serifada nos títulos e no saldo, monoespaçada nos valores). O saldo leva sublinhado duplo, como os totais de um livro-caixa.

Aplicação full-stack de finanças pessoais: cada usuário cria sua conta, registra entradas e saídas, acompanha o saldo do mês em gráficos e define orçamentos por categoria.

- **Back-end:** Node + TypeScript + Express 5, validação com Zod, login com JWT e senha com hash (bcrypt)
- **Front-end:** React + TypeScript + Vite, gráficos em SVG sem biblioteca, tema claro e escuro
- **Dados:** Postgres (Supabase) em produção; arquivo JSON no desenvolvimento local, sem instalar nada
- **Testes:** Vitest + Supertest (40 testes)

## Funcionalidades

- Cadastro, login e conta de demonstração (recriada no mês atual a cada entrada); cada usuário só enxerga os próprios dados
- Criar, editar e remover lançamentos
- Painel com saldo, entradas, saídas e percentual guardado no mês
- Gráfico de gastos por dia e rosca de despesas por categoria
- Orçamento mensal por categoria, com aviso ao chegar em 80% e ao estourar
- Lista agrupada por dia, com busca e filtro por tipo
- Navegação entre meses, tema claro/escuro e layout responsivo

## Como rodar

Requer Node 22 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:5173. A API sobe em http://localhost:3333 e o Vite repassa as chamadas `/api` para ela.

Sem configurar nada, os dados ficam em `server/data/finance.json`. Para usar um banco Postgres, copie `.env.example` para `.env` e preencha `DATABASE_URL` e `JWT_SECRET`.

```bash
npm test          # 13 testes da API + 27 testes das funções do front
npm run typecheck # checagem de tipos do back e do front
npm run build     # build de produção do front
```

## Estrutura

```
shared/types.ts          Contrato da API, usado pelo back e pelo front
vercel.json              Deploy na Vercel: API e site como dois serviços de um só projeto
server/src/
  index.ts               Ponto de entrada local: escolhe o armazenamento e sobe o servidor
  vercel.ts              Ponto de entrada na Vercel: exporta o mesmo app, sem listen()
  app.ts                 Monta o app: rotas, proteção por login e tratamento de erros
  auth.ts                Criação e verificação do token JWT (middleware requireAuth)
  schemas.ts             Validação dos dados de entrada (Zod)
  summary.ts             Regra de negócio: totais, saldo e gastos por categoria
  seed.ts                Dados de exemplo da conta de demonstração
  routes/
    auth.ts              Cadastro, login, conta de demonstração e "quem sou eu"
    transactions.ts      Lançamentos e resumo
    budgets.ts           Orçamentos
  storage/
    types.ts             Interface Storage: tudo que as rotas precisam do armazenamento
    memory.ts            Implementação em memória (usada nos testes)
    jsonFile.ts          Implementação em arquivo JSON (desenvolvimento local)
    postgres.ts          Implementação em Postgres (produção)
    index.ts             Escolhe Postgres se existir DATABASE_URL, senão arquivo JSON
server/tests/            Testes da API, do Postgres (com pg-mem) e do arquivo JSON
web/src/
  App.tsx                Sessão do usuário, estado da tela e carregamento dos dados
  api.ts                 Chamadas HTTP tipadas; envia o token em cada requisição
  money.ts               Conversão entre texto ("1.234,56") e centavos
  dates.ts               Datas locais, nome do mês e navegação entre meses
  charts.ts              Cálculos dos gráficos (arcos da rosca, gastos por dia)
  budgets.ts             Cálculo de gasto, percentual e situação de cada orçamento
  categoryColors.ts      Cor de cada categoria, usada na rosca e na lista
  components/
    AuthScreen.tsx       Tela de entrar / criar conta
    TopBar.tsx           Marca, usuário, navegação de mês e botão de tema
    BalanceHero.tsx      Painel de saldo, entradas, saídas e percentual guardado
    DailyChart.tsx       Gráfico de barras de gastos por dia (SVG)
    CategoryDonut.tsx    Gráfico de rosca por categoria (SVG)
    BudgetCard.tsx       Orçamentos do mês
    TransactionForm.tsx  Formulário de criar e editar lançamento
    TransactionList.tsx  Lista agrupada por dia, com busca e filtro
web/tests/               Testes das funções puras do front
```

## API

Todas as rotas, exceto as de `/api/auth` e `/api/health`, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/auth/register` | Cria a conta e devolve token + usuário. `409` se o e-mail já existe |
| POST | `/api/auth/login` | Devolve token + usuário. `401` se e-mail ou senha estiverem errados |
| POST | `/api/auth/demo` | Entra na conta de demonstração, com dados de exemplo |
| GET | `/api/auth/me` | Devolve o usuário do token (usado para restaurar a sessão) |
| GET | `/api/transactions?month=2026-11` | Lista os lançamentos do usuário |
| POST | `/api/transactions` | Cria um lançamento. `400` com a lista de problemas se inválido |
| PUT | `/api/transactions/:id` | Edita. `404` se não existir para este usuário |
| DELETE | `/api/transactions/:id` | Remove. `204` ou `404` |
| GET | `/api/summary?month=2026-11` | Entradas, saídas, saldo e gastos por categoria |
| GET | `/api/budgets` | Lista os orçamentos |
| PUT | `/api/budgets/:categoria` | Cria ou atualiza o limite da categoria |
| DELETE | `/api/budgets/:categoria` | Remove o orçamento |

## Como o login funciona

1. No cadastro, a senha passa pelo bcrypt e só o **hash** é salvo. Nem o banco nem a API conhecem a senha original.
2. No login, o bcrypt compara a senha digitada com o hash. A mensagem de erro é a mesma para e-mail inexistente e senha errada, para não revelar quais e-mails têm conta.
3. Dando certo, a API assina um **token JWT** com o id do usuário, válido por 7 dias, usando o segredo `JWT_SECRET`.
4. O front guarda o token no `localStorage` e o envia em toda requisição.
5. O middleware `requireAuth` verifica a assinatura e extrai o id do usuário. Toda consulta ao armazenamento recebe esse id, então um usuário nunca alcança dados de outro (o teste de isolamento garante isso).

## Deploy na Vercel com Supabase

O projeto usa os **Services** da Vercel: um único projeto com dois serviços definidos no `vercel.json`. O serviço `web` é o site React (build do Vite) e o serviço `server` é a API Express, que vira uma função serverless a partir de `server/src/vercel.ts`. Pedidos para `/api/*` vão para a API; todo o resto vai para o site. Tudo fica no mesmo domínio, então o front chama `/api` sem configurar endereço nenhum.

Variáveis de ambiente necessárias no projeto da Vercel:

- `DATABASE_URL`: string de conexão do Supabase, do tipo **Transaction pooler** (porta 6543)
- `JWT_SECRET`: um texto longo e aleatório

As tabelas são criadas automaticamente na primeira execução (`create table if not exists`). Sem `DATABASE_URL`, a API usa um arquivo temporário e os dados se perdem.

## Decisões técnicas

1. **Tipos compartilhados.** `shared/types.ts` é importado pelos dois lados só como tipo, então some na compilação. Se a API mudar, o front deixa de compilar.
2. **Dinheiro em centavos.** Valores são inteiros. Em ponto flutuante, `0.1 + 0.2` dá `0.30000000000000004`; com inteiros a soma é exata.
3. **Validação na borda.** O TypeScript só protege em tempo de compilação; o que chega pela rede é desconhecido. O Zod valida cada requisição.
4. **Armazenamento atrás de uma interface.** As rotas só conhecem `Storage`. Existem três implementações (memória, arquivo, Postgres) e trocar uma pela outra não altera nenhuma rota.
5. **Injeção de dependência.** `createApp(storage)` recebe o armazenamento, e por isso os testes sobem a aplicação inteira em memória.
6. **SQL com parâmetros.** Todas as consultas usam `$1, $2...`, nunca concatenação de texto, o que impede injeção de SQL.
7. **Regra de negócio em funções puras.** `summarize`, `calculateBudgets`, `buildDonutSegments` e `parseAmountToCents` não dependem de tela nem de banco e são testadas diretamente.
8. **Erros em um lugar só.** Erro de validação vira `400` com os campos problemáticos; o resto vira `500` sem vazar detalhes.

## Roteiro de apresentação (5 a 7 minutos)

1. **O que é (30s).** Abra o site, entre pela conta de demonstração e mostre o painel.
2. **Demonstração (2 min).** Crie uma conta nova (começa vazia: os dados são por usuário). Adicione um lançamento de `1.234,56`, edite, defina um orçamento menor que o gasto para ver o aviso de estouro, troque o tema e o mês.
3. **O contrato (30s).** `shared/types.ts`: back e front usam os mesmos tipos.
4. **O back (2 min).** `app.ts` (rotas públicas e protegidas) → `auth.ts` (token) → `routes/auth.ts` (hash da senha) → `storage/types.ts` (interface) → `storage/postgres.ts` (SQL com parâmetros).
5. **Os testes (1 min).** Rode `npm test` e mostre o teste de isolamento entre usuários em `server/tests/api.test.ts`. Conte que os testes pegaram um bug real: o campo de valor rejeitava "1.000".
6. **O front (1 min).** `App.tsx` restaura a sessão e busca os dados em paralelo; `charts.ts` mostra a conta da rosca feita à mão.

## Perguntas prováveis

- **Por que JWT e não sessão no servidor?** A API roda em funções serverless, que não guardam memória entre chamadas. O token carrega a identidade e qualquer instância consegue verificar.
- **Guardar o token no localStorage é seguro?** É simples, mas fica exposto se houver XSS. Em produção eu usaria cookie `httpOnly` com proteção contra CSRF.
- **Por que não usou o login pronto do Supabase?** Para mostrar que entendo o fluxo: hash, token e rota protegida. Num produto real, um serviço pronto costuma ser a escolha mais segura.
- **Por que três implementações de armazenamento?** Memória deixa os testes rápidos e isolados, arquivo permite rodar sem instalar banco, e Postgres é o de produção. A interface garante que as rotas não mudam.
- **Por que o resumo é calculado no back?** É regra de negócio: fica em um lugar só, testada, e qualquer cliente da API recebe o mesmo número.
- **O que faria a seguir?** Limite de tentativas de login, recuperação de senha, cookie `httpOnly`, migrações de banco versionadas, testes de interface e paginação.
