import { useState } from 'react'
import { Card, Btn, Input, SelectField, Modal, Spinner } from '../components/ui'
import { BRL, EXPENSE_CATS, INCOME_CATS, monthLabel } from '../lib/utils'

export default function TransactionsPage({ transactions, loading, onAdd, onRemove, month }) {
  const [filter, setFilter] = useState('all')
  const [modal, setModal]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({
    type: 'expense', description: '', amount: '', category: 'Alimentação',
    date: new Date().toISOString().split('T')[0],
  })

  const monthTx   = transactions.filter(t => t.month === month)
  const filtered  = filter === 'all' ? monthTx : monthTx.filter(t => t.type === filter)
  const income    = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense   = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    if (!form.description || !form.amount || !form.date) return
    setSaving(true)
    const txMonth = form.date.slice(0, 7)
    const { error } = await onAdd({ ...form, amount: parseFloat(form.amount), month: txMonth })
    if (error) setError(error.message)
    else {
      setModal(false)
      setForm({ type: 'expense', description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().split('T')[0] })
    }
    setSaving(false)
  }

  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Receitas', value: income,         color: '#68d391' },
          { label: 'Despesas', value: expense,         color: '#fc8181' },
          { label: 'Saldo',    value: income - expense, color: income - expense >= 0 ? '#68d391' : '#fc8181' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label} · {monthLabel(month)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace" }}>{BRL(s.value, 0)}</div>
          </Card>
        ))}
      </div>

      {/* Filters + add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'income', 'expense'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600,
                background: filter === f ? '#63b3ed' : 'rgba(255,255,255,0.06)',
                color: filter === f ? '#0b0f1a' : 'rgba(255,255,255,0.5)',
              }}>
              {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
        <Btn onClick={() => setModal(true)}>+ Adicionar</Btn>
      </div>

      {/* List */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Spinner /> : filtered.length === 0
          ? <p style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Nenhuma transação encontrada.</p>
          : [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i) => (
              <div key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: t.type === 'income' ? 'rgba(104,211,145,0.12)' : 'rgba(252,129,129,0.12)' }}>
                    {t.type === 'income' ? '💵' : '💸'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.description}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t.category} · {t.date}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 15, color: t.type === 'income' ? '#68d391' : '#fc8181' }}>
                    {t.type === 'income' ? '+' : '-'}{BRL(t.amount)}
                  </span>
                  <button onClick={() => onRemove(t.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#fc8181', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                    ✕
                  </button>
                </div>
              </div>
            ))
        }
      </Card>

      {modal && (
        <Modal title="Nova Transação" onClose={() => { setModal(false); setError('') }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['expense', 'income'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? 'Salário' : 'Alimentação' }))}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600,
                    background: form.type === t ? (t === 'income' ? '#68d391' : '#fc8181') : 'rgba(255,255,255,0.06)',
                    color: form.type === t ? '#0b0f1a' : 'rgba(255,255,255,0.5)',
                  }}>
                  {t === 'income' ? '💵 Receita' : '💸 Despesa'}
                </button>
              ))}
            </div>
            <Input label="Descrição" placeholder="Ex: Supermercado" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Valor (R$)" type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              <Input label="Data" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <SelectField label="Categoria" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </SelectField>
            {error && <p style={{ fontSize: 13, color: '#fc8181' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
