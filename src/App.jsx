import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useAssets } from './hooks/useAssets'
import { useBudgets } from './hooks/useBudgets'
import { useInstallments } from './hooks/useInstallments'
import { useFixedExpenses } from './hooks/useFixedExpenses'
import Layout from './components/layout/Layout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import TransactionsPage from './pages/Transactions'
import InvestmentsPage from './pages/Investments'
import InstallmentsPage from './pages/Installments'
import BudgetPage from './pages/Budget'
import { PlanningPage, ReportsPage } from './pages/PlanningReports'
import { Spinner } from './components/ui'
import { getCurrentMonth } from './lib/utils'

const GLOBAL_CSS = `
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes spin    { to { transform: rotate(360deg); } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Space Grotesk', sans-serif; background: #0b0f1a; color: #e2e8f0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.25); border-radius: 4px; }
  select option { background: #1a2035; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(.4); }
  input[type=month]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(.4); }
  input[type=range] { accent-color: #63b3ed; }
`

function AppInner() {
  const { user, loading: authLoading } = useAuth()
  const [page, setPage]   = useState('dashboard')
  const [month, setMonth] = useState(getCurrentMonth())

  const txHook     = useTransactions()
  const assetsHook = useAssets()
  const budgetHook = useBudgets()
  const instHook   = useInstallments()
  const fixedHook  = useFixedExpenses()

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#0b0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  if (!user) return <AuthPage />

  const expectedIncome = fixedHook.getExpectedIncome(month)

  return (
    <Layout page={page} onChangePage={setPage} month={month} onChangeMonth={setMonth}>
      {page === 'dashboard' && (
        <Dashboard
          transactions={txHook.transactions}
          assets={assetsHook.assets}
          dividends={assetsHook.dividends}
          installments={instHook.installments}
          fixedExpenses={fixedHook.fixedExpenses}
          expectedIncome={expectedIncome}
          month={month}
        />
      )}
      {page === 'transactions' && (
        <TransactionsPage
          transactions={txHook.transactions}
          loading={txHook.loading}
          onAdd={txHook.add}
          onRemove={txHook.remove}
          month={month}
        />
      )}
      {page === 'installments' && (
        <InstallmentsPage
          installments={instHook.installments}
          loading={instHook.loading}
          onAdd={instHook.add}
          onUpdate={instHook.update}
          onRemove={instHook.remove}
          expectedIncome={expectedIncome}
          onAddTransaction={txHook.add}
        />
      )}
      {page === 'budget' && (
        <BudgetPage
          transactions={txHook.transactions}
          fixedExpenses={fixedHook.fixedExpenses}
          installments={instHook.installments}
          onAddFixed={fixedHook.addFixed}
          onUpdateFixed={fixedHook.updateFixed}
          onRemoveFixed={fixedHook.removeFixed}
          expectedIncome={expectedIncome}
          onSaveIncomePlan={fixedHook.upsertIncomePlan}
          month={month}
        />
      )}
      {page === 'investments' && (
        <InvestmentsPage
          assets={assetsHook.assets}
          dividends={assetsHook.dividends}
          loading={assetsHook.loading}
          onAddAsset={assetsHook.addAsset}
          onUpdateAsset={assetsHook.updateAsset}
          onRemoveAsset={assetsHook.removeAsset}
          onUpsertDividend={assetsHook.upsertDividend}
        />
      )}
      {page === 'planning' && (
        <PlanningPage
          transactions={txHook.transactions}
          budgets={budgetHook.budgets}
          loading={budgetHook.loading}
          onUpsertBudget={budgetHook.upsert}
          onRemoveBudget={budgetHook.remove}
          month={month}
        />
      )}
      {page === 'reports' && (
        <ReportsPage
          transactions={txHook.transactions}
          assets={assetsHook.assets}
          dividends={assetsHook.dividends}
        />
      )}
    </Layout>
  )
}

export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </>
  )
}
