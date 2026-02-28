import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts'
import { KPI, Card, TooltipContent } from '../components/ui'
import { BRL, MONTHS_BR, PALETTE, lastNMonths, monthLabel } from '../lib/utils'

export default function Dashboard({ transactions, assets, dividends, month }) {
  const monthTx   = transactions.filter(t => t.month === month)
  const income    = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense   = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance   = income - expense

  const totalInvested = assets.reduce((s, a) => s + Number(a.cotas) * Number(a.preco_medio), 0)
  const totalCurrent  = assets.reduce((s, a) => s + Number(a.cotas) * Number(a.preco_atual), 0)

  // Dividends this month
  const monthDivs = dividends.filter(d => d.month === month)
  const totalDivMonth = monthDivs.reduce((s, d) => {
    const asset = assets.find(a => a.id === d.asset_id)
    return s + Number(d.valor_por_cota) * Number(asset?.cotas ?? 0)
  }, 0)

  // Bar chart last 6 months
  const months6 = lastNMonths(6)
  const barData = months6.map(m => {
    const tx = transactions.filter(t => t.month === m)
    return {
      name: MONTHS_BR[parseInt(m.split('-')[1]) - 1],
      Receitas: tx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      Despesas: tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    }
  })

  // Expense by category pie
  const catData = useMemo(() => {
    const cats = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] ?? 0) + Number(t.amount)
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value })).filter(d => d.value > 0)
  }, [monthTx])

  // Recent transactions
  const recent = [...monthTx].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <KPI label="Receitas do mês" value={BRL(income, 0)} icon="💰" color="#68d391" sub={monthLabel(month)} />
        <KPI label="Despesas do mês" value={BRL(expense, 0)} icon="📤" color="#fc8181" />
        <KPI label="Saldo" value={BRL(balance, 0)} icon={balance >= 0 ? '📈' : '📉'} color={balance >= 0 ? '#68d391' : '#fc8181'} sub={balance >= 0 ? 'positivo' : 'negativo'} />
        <KPI label="Dividendos recebidos" value={BRL(totalDivMonth, 0)} icon="💸" color="#f6ad55" sub="este mês" />
        <KPI label="Patrimônio investido" value={BRL(totalCurrent, 0)} icon="📊" color="#63b3ed"
          sub={totalInvested > 0 ? `${((totalCurrent - totalInvested) / totalInvested * 100).toFixed(1)}%` : '-'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>
        {/* Bar */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Receitas vs Despesas — últimos 6 meses</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipContent />} />
              <Bar dataKey="Receitas" fill="#68d391" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#fc8181" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Por categoria</div>
          {catData.length === 0
            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Sem despesas</div>
            : <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                      {catData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip content={<TooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                  {catData.slice(0, 4).map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[i % PALETTE.length] }} />
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.8)' }}>{BRL(d.value, 0)}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Transações recentes</div>
        {recent.length === 0
          ? <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '24px 0' }}>Nenhuma transação neste mês.</p>
          : recent.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: t.type === 'income' ? 'rgba(104,211,145,0.12)' : 'rgba(252,129,129,0.12)' }}>
                    {t.type === 'income' ? '💵' : '💸'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.description}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t.category} · {t.date}</div>
                  </div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: t.type === 'income' ? '#68d391' : '#fc8181' }}>
                  {t.type === 'income' ? '+' : '-'}{BRL(t.amount, 0)}
                </span>
              </div>
            ))
        }
      </Card>
    </div>
  )
}
