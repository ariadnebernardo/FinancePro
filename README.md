# 💰 FinançasPro

Aplicação de planejamento financeiro pessoal com controle de transações, módulo de investimentos (inspirado no Investidor10), simulador de dividendos, planejamento de despesas e relatórios.

**Stack:** React + Vite · Supabase (banco + auth) · Vercel (deploy)  
**Custo:** R$ 0,00 🎉

---

## 🚀 Setup em 5 passos

### 1. Supabase — criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New Project** e preencha nome e senha
3. Aguarde o projeto inicializar (~1 min)

### 2. Supabase — criar as tabelas

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New query**
3. Cole todo o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **Run** (ícone ▶️)
5. Confirme que aparece "Success. No rows returned"

### 3. Supabase — pegar as credenciais

1. Vá em **Project Settings → API**
2. Copie:
   - **Project URL** (ex: `https://abcxyz.supabase.co`)
   - **anon / public key** (a chave longa em "Project API keys")

### 4. Configurar variáveis de ambiente

Renomeie `.env.example` para `.env.local` e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

> ⚠️ **Nunca** suba o `.env.local` para o GitHub — ele já está no `.gitignore`

### 5. Deploy no Vercel

1. Suba o projeto para um repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) e clique em **New Project**
3. Importe o repositório
4. Em **Environment Variables**, adicione as duas variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy** — pronto! 🎉

---

## 💻 Rodar localmente

```bash
npm install
npm run dev
```

Acesse em `http://localhost:5173`

---

## 📦 Estrutura do projeto

```
finpro/
├── src/
│   ├── components/
│   │   ├── ui/          # Componentes reutilizáveis (Card, Btn, Input...)
│   │   └── layout/      # Layout com sidebar e header
│   ├── hooks/
│   │   ├── useAuth.jsx        # Autenticação (login/cadastro/logout)
│   │   ├── useTransactions.js # CRUD de transações
│   │   ├── useAssets.js       # CRUD de ativos e dividendos
│   │   └── useBudgets.js      # CRUD de orçamentos
│   ├── lib/
│   │   ├── supabase.js  # Cliente Supabase
│   │   └── utils.js     # Formatadores e helpers
│   ├── pages/
│   │   ├── AuthPage.jsx        # Login e cadastro
│   │   ├── Dashboard.jsx       # Visão geral
│   │   ├── Transactions.jsx    # Entradas e saídas
│   │   ├── Investments.jsx     # Carteira, dividendos, simulador, agenda
│   │   └── PlanningReports.jsx # Planejamento e relatórios
│   ├── App.jsx          # Roteamento e providers
│   └── main.jsx         # Entry point
├── supabase-schema.sql  # Schema do banco de dados
├── vercel.json          # Configuração do Vercel
├── .env.example         # Template de variáveis
└── package.json
```

---

## ✨ Funcionalidades

### Dashboard
- KPIs de receitas, despesas, saldo e patrimônio
- Gráfico de barras (últimos 6 meses)
- Distribuição de gastos por categoria
- Transações recentes

### Transações
- Registro de receitas e despesas
- Filtro por tipo e navegação por mês
- Categorização completa

### Investimentos (inspirado no Investidor10)
- **Carteira:** tabela completa com cotas, preço médio, preço atual, resultado e DY anual
- **Dividendos:** histórico de proventos com gráfico mensal e contribuição por ativo
- **Simulador:** sliders para ajustar cotas por ativo, horizonte de até 60 meses e opção de reinvestimento automático de dividendos
- **Agenda:** calendário de proventos com data-com, data de pagamento e linha do tempo

### Planejamento
- Metas de gasto por categoria
- Barra de progresso com alertas visuais (verde/amarelo/vermelho)

### Relatórios
- Evolução financeira histórica
- Ranking de gastos por categoria
- KPIs acumulados

---

## 🔒 Segurança

- Cada usuário só acessa seus próprios dados (Row Level Security no Supabase)
- Senhas gerenciadas pelo Supabase Auth (nunca armazenadas em texto puro)
- Chave `anon` é segura para uso no frontend

---

## 🆓 Limites do plano gratuito

| Serviço | Limite free | Suficiente para... |
|---------|------------|---------------------|
| Vercel  | 100 GB banda/mês, projetos ilimitados | Centenas de usuários |
| Supabase | 500 MB banco, 50k usuários auth | Anos de uso pessoal |
# FinancePro
