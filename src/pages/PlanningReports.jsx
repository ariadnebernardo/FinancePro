// ── Planning page ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts'
import { Card, KPI, Btn, Input, SelectField, Modal, Spinner } from '../components/ui'
import { BRL, EXPENSE_CATS, PALETTE, MONTHS_BR, lastNMonths, monthLabel } from '../lib/utils'

export function PlanningPage({ transactions, budgets, loading, onUpsertBudget, onRemoveBudget, month }) {
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ category: 'Alimentação', limit: '' })

  const monthTx      = transactions.filter(t => t.month === month && t.type === 'expense')
  const monthBudgets = budgets.filter(b => b.month === month)
  const totalBudget  = monthBudgets.reduce((s, b) => s + Number(b.limit), 0)
  const totalSpent   = monthTx.reduce((s, t) => s + Number(t.amount), 0)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await onUpsertBudget({ category: form.category, limit: +form.limit, month })
    setSaving(false); setModal(false)
    setForm({ category: 'Alimentação', limit: '' })
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          Orçamento {monthLabel(month)}: <span style={{ color: '#f6ad55', fontWeight: 700 }}>{BRL(totalBudget, 0)}</span>
          {' '}· Gasto: <span style={{ color: '#fc8181', fontWeight: 700 }}>{BRL(totalSpent, 0)}</span>
        </div>
        <Btn onClick={() => setModal(true)}>+ Definir meta</Btn>
      </div>

      {monthBudgets.length === 0
        ? <Card style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Nenhuma meta definida para {monthLabel(month)}.</p>
          </Card>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {monthBudgets.map(b => {
              const spent = monthTx.filter(t => t.category === b.category).reduce((s, t) => s + Number(t.amount), 0)
              const pct   = Math.min(spent / Number(b.limit) * 100, 100)
              const over  = spent > Number(b.limit)
              const color = pct < 70 ? '#68d391' : pct < 90 ? '#f6ad55' : '#fc8181'
              return (
                <Card key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{b.category}</span>
                      {over && <span style={{ background: 'rgba(252,129,129,0.15)', color: '#fc8181', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Excedido</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.5)' }}>{BRL(spent, 0)} / {BRL(Number(b.limit), 0)}</span>
                      <button onClick={() => onRemoveBudget(b.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#fc8181', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 999, height: 8 }}>
                    <div style={{ width: `${pct}%`, background: color, borderRadius: 999, height: '100%', transition: 'width .7s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>0%</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct.toFixed(0)}% utilizado</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>100%</span>
                  </div>
                </Card>
              )
            })}
          </div>
      }

      {modal && (
        <Modal title="Nova meta de despesa" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SelectField label="Categoria" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
            </SelectField>
            <Input label="Limite mensal (R$)" type="number" step="0.01" placeholder="800" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} required />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Se já existir uma meta para essa categoria no mês, ela será atualizada.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Reports page ──────────────────────────────────────────────────────────────
export function ReportsPage({ transactions, assets, dividends }) {
  const months6 = lastNMonths(6)
  const lineData = months6.map(m => {
    const tx = transactions.filter(t => t.month === m)
    const inc = tx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const exp = tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const divs = dividends.reduce((s, d) => {
      if (d.month !== m) return s
      const a = assets.find(a => a.id === d.asset_id)
      return s + Number(d.valor_por_cota) * Number(a?.cotas ?? 0)
    }, 0)
    return { name: MONTHS_BR[parseInt(m.split('-')[1]) - 1], Receitas: inc, Despesas: exp, Saldo: inc - exp, Dividendos: divs }
  })

  const allCatData = EXPENSE_CATS.map(cat => ({
    name: cat,
    value: transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + Number(t.amount), 0),
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value)

  const totalIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense  = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const totalInvested = assets.reduce((s, a) => s + Number(a.cotas) * Number(a.preco_medio), 0)
  const totalCurrent  = assets.reduce((s, a) => s + Number(a.cotas) * Number(a.preco_atual), 0)
  const totalDivs     = dividends.reduce((s, d) => {
    const a = assets.find(a => a.id === d.asset_id)
    return s + Number(d.valor_por_cota) * Number(a?.cotas ?? 0)
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <KPI label="Total recebido"    value={BRL(totalIncome, 0)}              icon="💰" color="#68d391" />
        <KPI label="Total gasto"       value={BRL(totalExpense, 0)}             icon="💸" color="#fc8181" />
        <KPI label="Patrimônio"        value={BRL(totalCurrent, 0)}             icon="📊" color="#63b3ed" sub={`+${((totalCurrent-totalInvested)/Math.max(totalInvested,1)*100).toFixed(1)}%`} />
        <KPI label="Dividendos totais" value={BRL(totalDivs, 0)}               icon="🏆" color="#f6ad55" />
        <KPI label="Saldo acumulado"   value={BRL(totalIncome - totalExpense, 0)} icon={totalIncome >= totalExpense ? '📈' : '📉'} color={totalIncome >= totalExpense ? '#68d391' : '#fc8181'} />
      </div>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Evolução financeira — últimos 6 meses</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => BRL(v)} contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
            <Line type="monotone" dataKey="Receitas"  stroke="#68d391" strokeWidth={2} dot={{ fill: '#68d391', r: 4 }} />
            <Line type="monotone" dataKey="Despesas"  stroke="#fc8181" strokeWidth={2} dot={{ fill: '#fc8181', r: 4 }} />
            <Line type="monotone" dataKey="Saldo"     stroke="#f6ad55" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#f6ad55', r: 3 }} />
            <Line type="monotone" dataKey="Dividendos" stroke="#63b3ed" strokeWidth={2} dot={{ fill: '#63b3ed', r: 3 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Gastos por categoria (histórico)</div>
        {allCatData.length === 0
          ? <p style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Sem dados suficientes.</p>
          : <ResponsiveContainer width="100%" height={240}>
              <BarChart data={allCatData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={v => BRL(v)} contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Bar dataKey="value" name="Total" radius={[0, 6, 6, 0]}>
                  {allCatData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        }
      </Card>
    </div>
  )
}
