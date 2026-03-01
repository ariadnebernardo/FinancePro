import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LineChart, Line, Legend, ReferenceLine,
} from 'recharts'
import { Card, KPI, Btn, Input, SelectField, Modal, Spinner, TooltipContent } from '../components/ui'
import { BRL, EXPENSE_CATS, MONTHS_BR, PALETTE, lastNMonths, monthLabel, getCurrentMonth, nextMonth } from '../lib/utils'

const FIXED_CATS = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Serviços', 'Outros']

// ── Despesas fixas ────────────────────────────────────────────────────────────
function FixedExpensesSection({ fixedExpenses, onAdd, onUpdate, onRemove }) {
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState({ description: '', category: 'Moradia', amount: '', due_day: '', active: true })

  const total = fixedExpenses.filter(f => f.active).reduce((s, f) => s + Number(f.amount), 0)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await onAdd({ ...form, amount: parseFloat(form.amount), due_day: form.due_day ? parseInt(form.due_day) : null })
    setSaving(false); setModal(false)
    setForm({ description: '', category: 'Moradia', amount: '', due_day: '', active: true })
  }

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🔁 Despesas fixas recorrentes</span>
          <span style={{ marginLeft: 12, fontFamily: "'JetBrains Mono',monospace", color: '#fc8181', fontSize: 14, fontWeight: 700 }}>{BRL(total, 0)}/mês</span>
        </div>
        <Btn onClick={() => setModal(true)}>+ Adicionar</Btn>
      </div>

      {fixedExpenses.length === 0
        ? <p style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Nenhuma despesa fixa cadastrada.</p>
        : fixedExpenses.map((f, i) => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 20px', borderBottom: i < fixedExpenses.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              opacity: f.active ? 1 : 0.45,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(252,129,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  🔁
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.description}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    {f.category}{f.due_day ? ` · vence dia ${f.due_day}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: f.active ? '#fc8181' : 'rgba(255,255,255,0.3)' }}>{BRL(f.amount)}</span>
                <button onClick={() => onUpdate(f.id, { active: !f.active })}
                  style={{ background: f.active ? 'rgba(104,211,145,0.1)' : 'rgba(255,255,255,0.06)', border: 'none', color: f.active ? '#68d391' : 'rgba(255,255,255,0.3)', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                  {f.active ? '✓ Ativa' : 'Inativa'}
                </button>
                <button onClick={() => onRemove(f.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#fc8181', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))
      }

      {modal && (
        <Modal title="Nova despesa fixa" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Descrição" placeholder="Ex: Aluguel, Netflix, Academia..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <SelectField label="Categoria" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {FIXED_CATS.map(c => <option key={c}>{c}</option>)}
              </SelectField>
              <Input label="Dia de vencimento" type="number" min="1" max="31" placeholder="Ex: 10" value={form.due_day} onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} />
            </div>
            <Input label="Valor mensal (R$)" type="number" step="0.01" placeholder="Ex: 1500,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  )
}

// ── Projeção de saldo ─────────────────────────────────────────────────────────
function SaldoProjection({ expectedIncome, fixedExpenses, installments, transactions, month }) {
  const months6 = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() + i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }, [])

  const fixedTotal = fixedExpenses.filter(f => f.active).reduce((s, f) => s + Number(f.amount), 0)

  const data = months6.map(m => {
    // Real income if available, else expected
    const realIncome = transactions
      .filter(t => t.month === m && t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0)

    const income = realIncome > 0 ? realIncome : Number(expectedIncome)

    // Installments active in this month
    const instTotal = installments
      .filter(i => {
        const [fy, fm] = i.start_date.slice(0, 7).split('-').map(Number)
        const em = (() => {
          const d = new Date(i.start_date + 'T12:00:00')
          d.setMonth(d.getMonth() + i.total_installments - 1)
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        })()
        const [ty, tm] = em.split('-').map(Number)
        const [qy, qm] = m.split('-').map(Number)
        return (qy * 12 + qm) >= (fy * 12 + fm) && (qy * 12 + qm) <= (ty * 12 + tm)
      })
      .reduce((s, i) => s + Number(i.installment_value), 0)

    // Variable expenses (already registered)
    const varExpense = transactions
      .filter(t => t.month === m && t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0)

    const totalOut = fixedTotal + instTotal + (varExpense > 0 ? varExpense : 0)
    const saldo    = income - totalOut

    return {
      name: MONTHS_BR[parseInt(m.split('-')[1]) - 1],
      month: m,
      renda: income,
      fixas: fixedTotal,
      parcelas: instTotal,
      variavel: varExpense,
      saldo,
    }
  })

  return (
    <Card>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📈 Projeção de saldo — próximos 6 meses</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<TooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }} />
          <Bar dataKey="fixas"    name="Fixas"     stackId="out" fill="#fc8181" />
          <Bar dataKey="parcelas" name="Parcelas"  stackId="out" fill="#f6ad55" />
          <Bar dataKey="variavel" name="Variável"  stackId="out" fill="#b794f4" radius={[0, 0, 0, 0]} />
          <Bar dataKey="saldo"    name="Saldo livre" fill="#68d391" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.saldo >= 0 ? '#68d391' : '#fc8181'} />)}
          </Bar>
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Mês', 'Renda', 'Fixas', 'Parcelas', 'Variável', 'Saldo livre'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 10px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>{d.name}</td>
                <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono',monospace", color: '#68d391', textAlign: 'right' }}>{BRL(d.renda, 0)}</td>
                <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono',monospace", color: '#fc8181', textAlign: 'right' }}>{BRL(d.fixas, 0)}</td>
                <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono',monospace", color: '#f6ad55', textAlign: 'right' }}>{d.parcelas > 0 ? BRL(d.parcelas, 0) : '—'}</td>
                <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono',monospace", color: '#b794f4', textAlign: 'right' }}>{d.variavel > 0 ? BRL(d.variavel, 0) : '—'}</td>
                <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: d.saldo >= 0 ? '#68d391' : '#fc8181', textAlign: 'right' }}>{BRL(d.saldo, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function BudgetPage({
  transactions, fixedExpenses, installments,
  onAddFixed, onUpdateFixed, onRemoveFixed,
  expectedIncome, onSaveIncomePlan,
  month,
}) {
  const [editingIncome, setEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput]     = useState('')
  const [saving, setSaving]               = useState(false)

  const fixedTotal = fixedExpenses.filter(f => f.active).reduce((s, f) => s + Number(f.amount), 0)
  const instTotal  = installments
    .filter(i => {
      const cm = getCurrentMonth()
      const [fy, fm] = i.start_date.slice(0, 7).split('-').map(Number)
      const d = new Date(i.start_date + 'T12:00:00')
      d.setMonth(d.getMonth() + i.total_installments - 1)
      const em = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const [ty, tm] = em.split('-').map(Number)
      const [qy, qm] = cm.split('-').map(Number)
      return (qy * 12 + qm) >= (fy * 12 + fm) && (qy * 12 + qm) <= (ty * 12 + tm)
    })
    .reduce((s, i) => s + Number(i.installment_value), 0)

  const varSpent   = transactions.filter(t => t.month === month && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const committed  = fixedTotal + instTotal
  const totalOut   = committed + varSpent
  const freeIncome = Number(expectedIncome) - totalOut
  const pctCommit  = expectedIncome > 0 ? (committed / Number(expectedIncome)) * 100 : 0

  async function saveIncome() {
    setSaving(true)
    await onSaveIncomePlan(month, parseFloat(incomeInput))
    setSaving(false); setEditingIncome(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Renda esperada */}
      <Card style={{ borderLeft: '4px solid #68d391' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>RENDA ESPERADA — {monthLabel(month)}</div>
            {editingIncome
              ? <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                  <input
                    type="number" step="0.01" autoFocus
                    value={incomeInput}
                    onChange={e => setIncomeInput(e.target.value)}
                    placeholder="Ex: 6500,00"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px', color: '#e2e8f0', fontSize: 18, fontFamily: "'JetBrains Mono',monospace", width: 200, outline: 'none' }}
                  />
                  <Btn onClick={saveIncome} disabled={saving}>{saving ? '...' : 'Salvar'}</Btn>
                  <Btn variant="ghost" onClick={() => setEditingIncome(false)}>Cancelar</Btn>
                </div>
              : <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 28, color: '#68d391' }}>
                    {expectedIncome > 0 ? BRL(expectedIncome, 0) : 'Não definida'}
                  </span>
                  <button onClick={() => { setIncomeInput(expectedIncome || ''); setEditingIncome(true) }}
                    style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.5)', padding: '6px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 12 }}>
                    ✏ Editar
                  </button>
                </div>
            }
          </div>
          {expectedIncome > 0 && !editingIncome && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>SALDO LIVRE ESTIMADO</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 24, color: freeIncome >= 0 ? '#63b3ed' : '#fc8181' }}>
                {BRL(freeIncome, 0)}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* KPIs */}
      {expectedIncome > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <KPI label="Despesas fixas" value={BRL(fixedTotal, 0)} icon="🔁" color="#fc8181"
            sub={`${expectedIncome > 0 ? ((fixedTotal / Number(expectedIncome)) * 100).toFixed(0) : 0}% da renda`} />
          <KPI label="Parcelas do mês" value={BRL(instTotal, 0)} icon="💳" color="#f6ad55"
            sub={`${expectedIncome > 0 ? ((instTotal / Number(expectedIncome)) * 100).toFixed(0) : 0}% da renda`} />
          <KPI label="Gasto variável" value={BRL(varSpent, 0)} icon="💸" color="#b794f4"
            sub={monthLabel(month)} />
          <KPI label="Comprometido fixo" value={BRL(committed, 0)} icon="📌" color={pctCommit > 70 ? '#fc8181' : '#63b3ed'}
            sub={`${pctCommit.toFixed(0)}% da renda`} />
        </div>
      )}

      {/* Visual breakdown */}
      {expectedIncome > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Onde vai seu dinheiro em {monthLabel(month)}</div>
          {[
            { label: 'Despesas fixas', value: fixedTotal,  color: '#fc8181' },
            { label: 'Parcelas',       value: instTotal,   color: '#f6ad55' },
            { label: 'Gasto variável', value: varSpent,    color: '#b794f4' },
            { label: 'Saldo livre',    value: Math.max(freeIncome, 0), color: '#68d391' },
          ].map(item => {
            const pct = Number(expectedIncome) > 0 ? (item.value / Number(expectedIncome)) * 100 : 0
            return (
              <div key={item.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: item.color }}>{BRL(item.value, 0)}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.3)', minWidth: 40, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 999, height: 10 }}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, background: item.color, borderRadius: 999, height: '100%', transition: 'width .6s' }} />
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* Fixed expenses list */}
      <FixedExpensesSection fixedExpenses={fixedExpenses} onAdd={onAddFixed} onUpdate={onUpdateFixed} onRemove={onRemoveFixed} />

      {/* Projection */}
      <SaldoProjection
        expectedIncome={expectedIncome}
        fixedExpenses={fixedExpenses}
        installments={installments}
        transactions={transactions}
        month={month}
      />
    </div>
  )
}
