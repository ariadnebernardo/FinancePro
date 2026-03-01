import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LineChart, Line, Legend,
} from 'recharts'
import { Card, KPI, Btn, Input, SelectField, Modal, Spinner, Badge, TooltipContent } from '../components/ui'
import { BRL, EXPENSE_CATS, MONTHS_BR, PALETTE, lastNMonths } from '../lib/utils'

// ── helpers ──────────────────────────────────────────────────────────────────

// Dado um parcelamento, retorna o mês (YYYY-MM) da última parcela
function endMonth(inst) {
  const d = new Date(inst.start_date + 'T12:00:00')
  d.setMonth(d.getMonth() + inst.total_installments - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Quantas parcelas restam a partir de hoje
function remainingInstallments(inst) {
  return inst.total_installments - inst.paid_installments
}

// Valor restante total
function remainingAmount(inst) {
  return remainingInstallments(inst) * Number(inst.installment_value)
}

// Retorna true se o parcelamento está ativo no mês YYYY-MM
function activeInMonth(inst, month) {
  const [fy, fm] = inst.start_date.slice(0, 7).split('-').map(Number)
  const [ty, tm] = endMonth(inst).split('-').map(Number)
  const [qy, qm] = month.split('-').map(Number)
  const start = fy * 12 + fm
  const end   = ty * 12 + tm
  const query = qy * 12 + qm
  return query >= start && query <= end
}

// Dias até próximo vencimento (baseia no dia de start_date)
function daysUntilNext(inst) {
  const today = new Date()
  const dueDay = new Date(inst.start_date + 'T12:00:00').getDate()
  let candidate = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (candidate < today) candidate.setMonth(candidate.getMonth() + 1)
  return Math.ceil((candidate - today) / 86400000)
}

// ── Componentes internos ─────────────────────────────────────────────────────

function ProgressBar({ pct, color = '#63b3ed', height = 8 }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 999, height }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 999, height: '100%', transition: 'width .6s' }} />
    </div>
  )
}

function InstallmentCard({ inst, onPay, onRemove }) {
  const paid    = inst.paid_installments
  const total   = inst.total_installments
  const pct     = (paid / total) * 100
  const rem     = remainingInstallments(inst)
  const remAmt  = remainingAmount(inst)
  const end     = endMonth(inst)
  const days    = daysUntilNext(inst)
  const done    = rem === 0

  const urgency = days <= 3 ? '#fc8181' : days <= 7 ? '#f6ad55' : '#68d391'
  const [endY, endM] = end.split('-')
  const endLabel = `${MONTHS_BR[parseInt(endM) - 1]}/${endY}`

  return (
    <Card style={{ borderLeft: `4px solid ${done ? '#68d391' : urgency}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{inst.description}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {inst.category}{inst.card ? ` · ${inst.card}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {done
            ? <Badge color="green">✓ Quitado</Badge>
            : days <= 7
              ? <Badge color={days <= 3 ? 'red' : 'amber'}>{days === 0 ? 'Vence hoje!' : `Vence em ${days}d`}</Badge>
              : null
          }
          <button onClick={() => onRemove(inst.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#fc8181', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{paid} de {total} parcelas pagas</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: done ? '#68d391' : '#63b3ed' }}>{pct.toFixed(0)}%</span>
        </div>
        <ProgressBar pct={pct} color={done ? '#68d391' : '#63b3ed'} height={10} />
      </div>

      {/* Values */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: done ? 0 : 14 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontWeight: 600 }}>PARCELA</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: '#fc8181' }}>{BRL(inst.installment_value)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontWeight: 600 }}>RESTANTE</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: done ? '#68d391' : '#f6ad55' }}>{done ? 'Pago!' : BRL(remAmt)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontWeight: 600 }}>TERMINA</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: done ? '#68d391' : 'rgba(255,255,255,0.8)' }}>{done ? '✓' : endLabel}</div>
        </div>
      </div>

      {/* Pay button */}
      {!done && (
        <Btn variant="green" onClick={() => onPay(inst)} style={{ width: '100%', justifyContent: 'center' }}>
          ✓ Registrar parcela paga ({paid + 1}/{total})
        </Btn>
      )}
    </Card>
  )
}

// ── Simulador ─────────────────────────────────────────────────────────────────
function Simulator({ installments, expectedIncome }) {
  const [newValue,  setNewValue]  = useState('')
  const [newQty,    setNewQty]    = useState('')
  const [newMonth,  setNewMonth]  = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })

  const months12 = lastNMonths(12)

  // Comprometido atual por mês
  const committed = useMemo(() => {
    return months12.map(m => {
      const total = installments
        .filter(i => activeInMonth(i, m))
        .reduce((s, i) => s + Number(i.installment_value), 0)
      return { month: m, name: MONTHS_BR[parseInt(m.split('-')[1]) - 1], committed: total }
    })
  }, [installments])

  // Meses futuros afetados pela nova simulação
  const simMonths = useMemo(() => {
    if (!newValue || !newQty || !newMonth) return []
    const qty = parseInt(newQty)
    return Array.from({ length: qty }, (_, i) => {
      const [y, mo] = newMonth.split('-').map(Number)
      const d = new Date(y, mo - 1 + i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  }, [newValue, newQty, newMonth])

  const newMonthly = parseFloat(newValue || 0) / parseInt(newQty || 1)

  // Build combined chart data
  const chartData = useMemo(() => {
    const allMonths = Array.from(new Set([...months12, ...simMonths])).sort()
    return allMonths.map(m => {
      const base = installments.filter(i => activeInMonth(i, m)).reduce((s, i) => s + Number(i.installment_value), 0)
      const sim  = simMonths.includes(m) ? newMonthly : 0
      const name = MONTHS_BR[parseInt(m.split('-')[1]) - 1] + (m.split('-')[0] !== String(new Date().getFullYear()) ? `/${m.split('-')[0].slice(2)}` : '')
      return { month: m, name, atual: base, simulado: sim, total: base + sim, renda: Number(expectedIncome) }
    })
  }, [installments, simMonths, newMonthly, expectedIncome])

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const currentCommitted = installments.filter(i => activeInMonth(i, currentMonth)).reduce((s, i) => s + Number(i.installment_value), 0)
  const simTotal = currentCommitted + (simMonths.includes(currentMonth) ? newMonthly : 0)
  const canAfford = expectedIncome > 0 && simTotal <= Number(expectedIncome) * 0.4

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🧮 Simular nova compra parcelada</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <Input label="Valor total (R$)" type="number" step="0.01" placeholder="Ex: 1200,00" value={newValue} onChange={e => setNewValue(e.target.value)} />
          <Input label="Número de parcelas" type="number" placeholder="Ex: 12" value={newQty} onChange={e => setNewQty(e.target.value)} />
          <Input label="Início em" type="month" value={newMonth} onChange={e => setNewMonth(e.target.value)} />
        </div>

        {newValue && newQty && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>PARCELA MENSAL</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 20, color: '#63b3ed' }}>{BRL(newMonthly)}</div>
            </div>
            <div style={{ background: 'rgba(246,173,85,0.08)', border: '1px solid rgba(246,173,85,0.2)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>COMPROMETIDO TOTAL</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 20, color: '#f6ad55' }}>{BRL(simTotal)}/mês</div>
            </div>
            {expectedIncome > 0 && (
              <div style={{ background: canAfford ? 'rgba(104,211,145,0.08)' : 'rgba(252,129,129,0.08)', border: `1px solid ${canAfford ? 'rgba(104,211,145,0.25)' : 'rgba(252,129,129,0.25)'}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>VEREDICTO</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: canAfford ? '#68d391' : '#fc8181' }}>
                  {canAfford ? '✅ Cabe no orçamento' : '⚠️ Compromete demais'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {((simTotal / Number(expectedIncome)) * 100).toFixed(0)}% da renda em parcelas
                  {!canAfford && ' (recomendado: máx 40%)'}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {chartData.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
            Impacto mensal
            {newValue && newQty && <span style={{ fontSize: 12, color: '#f6ad55', marginLeft: 10 }}>🟡 inclui simulação</span>}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v.toFixed(0)}`} />
              <Tooltip content={<TooltipContent />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }} />
              <Bar dataKey="atual"    name="Parcelas atuais"  stackId="a" fill="#63b3ed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="simulado" name="Nova compra"      stackId="a" fill="#f6ad55" radius={[4, 4, 0, 0]} />
              {expectedIncome > 0 && <Line dataKey="renda" name="Renda esperada" stroke="#68d391" strokeWidth={2} strokeDasharray="5 5" dot={false} type="monotone" />}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}

// ── Projeção por mês ──────────────────────────────────────────────────────────
function MonthlyProjection({ installments }) {
  const months = lastNMonths(12)

  const data = months.map(m => {
    const active = installments.filter(i => activeInMonth(i, m))
    const total  = active.reduce((s, i) => s + Number(i.installment_value), 0)
    return {
      name: MONTHS_BR[parseInt(m.split('-')[1]) - 1],
      month: m,
      total,
      count: active.length,
    }
  })

  // How many installments end each month
  const ending = installments.reduce((acc, inst) => {
    const em = endMonth(inst)
    if (!acc[em]) acc[em] = []
    acc[em].push(inst.description)
    return acc
  }, {})

  return (
    <Card>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📅 Comprometido por mês (próximos 12 meses)</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={22}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v.toFixed(0)}`} />
          <Tooltip content={<TooltipContent />} />
          <Bar dataKey="total" name="Total parcelado" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => {
              const isEnding = ending[d.month]?.length > 0
              return <Cell key={i} fill={isEnding ? '#68d391' : d.total > 0 ? '#63b3ed' : 'rgba(255,255,255,0.07)'} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Ending legend */}
      {Object.keys(ending).length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(ending).sort().map(([m, descs]) => {
            const [y, mo] = m.split('-')
            return (
              <div key={m} style={{ background: 'rgba(104,211,145,0.08)', border: '1px solid rgba(104,211,145,0.2)', borderRadius: 10, padding: '6px 12px', fontSize: 12 }}>
                <span style={{ color: '#68d391', fontWeight: 700 }}>{MONTHS_BR[parseInt(mo) - 1]}/{y}: </span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{descs.join(', ')} {descs.length === 1 ? 'termina' : 'terminam'} ✓</span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
const FORM_DEFAULT = {
  description: '', category: 'Outros', total_amount: '', installment_value: '',
  total_installments: '', paid_installments: '0',
  start_date: new Date().toISOString().split('T')[0], card: '',
}

export default function InstallmentsPage({ installments, loading, onAdd, onUpdate, onRemove, expectedIncome }) {
  const [tab, setTab]     = useState('lista')
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState(FORM_DEFAULT)
  const [filter, setFilter] = useState('active') // active | done | all

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const totalCommitted = installments
    .filter(i => activeInMonth(i, currentMonth))
    .reduce((s, i) => s + Number(i.installment_value), 0)

  const totalRemaining = installments
    .filter(i => remainingInstallments(i) > 0)
    .reduce((s, i) => s + remainingAmount(i), 0)

  const endingSoon = installments.filter(i => {
    const rem = remainingInstallments(i)
    return rem > 0 && rem <= 2
  })

  const filtered = installments.filter(i => {
    const rem = remainingInstallments(i)
    if (filter === 'active') return rem > 0
    if (filter === 'done')   return rem === 0
    return true
  })

  // Auto-calculate installment_value when total and qty change
  function handleFormChange(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if ((field === 'total_amount' || field === 'total_installments') && next.total_amount && next.total_installments) {
        next.installment_value = (parseFloat(next.total_amount) / parseInt(next.total_installments)).toFixed(2)
      }
      return next
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      total_amount: parseFloat(form.total_amount),
      installment_value: parseFloat(form.installment_value),
      total_installments: parseInt(form.total_installments),
      paid_installments: parseInt(form.paid_installments),
    }
    const { error } = await onAdd(payload)
    if (!error) { setModal(false); setForm(FORM_DEFAULT) }
    setSaving(false)
  }

  async function handlePay(inst) {
    if (inst.paid_installments >= inst.total_installments) return
    await onUpdate(inst.id, { paid_installments: inst.paid_installments + 1 })
  }

  const TABS = ['lista', 'projeção', 'simulador']
  const TAB_LABELS = { lista: '📋 Lista', projeção: '📅 Projeção', simulador: '🧮 Simulador' }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        <KPI label="Comprometido este mês" value={BRL(totalCommitted, 0)} icon="💳" color="#fc8181"
          sub={expectedIncome > 0 ? `${((totalCommitted / Number(expectedIncome)) * 100).toFixed(0)}% da renda` : `${installments.filter(i => activeInMonth(i, currentMonth)).length} parcelas`} />
        <KPI label="Total restante a pagar" value={BRL(totalRemaining, 0)} icon="📊" color="#f6ad55" />
        <KPI label="Terminando em breve" value={endingSoon.length} icon="🏁" color="#68d391" sub={endingSoon.length > 0 ? endingSoon.map(i => i.description).join(', ').slice(0, 30) : 'nenhum'} />
        <KPI label="Parcelamentos ativos" value={installments.filter(i => remainingInstallments(i) > 0).length} icon="📌" color="#63b3ed" sub={`de ${installments.length} total`} />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600,
              borderBottom: tab === t ? '2px solid #63b3ed' : '2px solid transparent',
              color: tab === t ? '#63b3ed' : 'rgba(255,255,255,0.4)', marginBottom: -1, transition: 'all .2s',
            }}>
            {TAB_LABELS[t]}
          </button>
        ))}
        {tab === 'lista' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            {['active', 'done', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '6px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontFamily: "'Space Grotesk',sans-serif", fontSize: 12, fontWeight: 600,
                  background: filter === f ? '#63b3ed' : 'rgba(255,255,255,0.06)',
                  color: filter === f ? '#0b0f1a' : 'rgba(255,255,255,0.5)',
                }}>
                {f === 'active' ? 'Ativos' : f === 'done' ? 'Quitados' : 'Todos'}
              </button>
            ))}
            <Btn onClick={() => setModal(true)} style={{ marginLeft: 8 }}>+ Parcelamento</Btn>
          </div>
        )}
      </div>

      {/* Tab: Lista */}
      {tab === 'lista' && (
        filtered.length === 0
          ? <Card style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                {filter === 'active' ? 'Nenhum parcelamento ativo.' : filter === 'done' ? 'Nenhum parcelamento quitado ainda.' : 'Nenhum parcelamento cadastrado.'}
              </p>
              {filter === 'active' && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 8 }}>Adicione suas compras parceladas no botão acima.</p>}
            </Card>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14 }}>
              {filtered.map(inst => (
                <InstallmentCard key={inst.id} inst={inst} onPay={handlePay} onRemove={onRemove} />
              ))}
            </div>
      )}

      {/* Tab: Projeção */}
      {tab === 'projeção' && <MonthlyProjection installments={installments} />}

      {/* Tab: Simulador */}
      {tab === 'simulador' && <Simulator installments={installments} expectedIncome={expectedIncome} />}

      {/* Modal */}
      {modal && (
        <Modal title="Novo parcelamento" onClose={() => { setModal(false); setForm(FORM_DEFAULT) }} width={500}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Descrição" placeholder="Ex: iPhone 15, Geladeira, Curso..." value={form.description} onChange={e => handleFormChange('description', e.target.value)} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <SelectField label="Categoria" value={form.category} onChange={e => handleFormChange('category', e.target.value)}>
                {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
              </SelectField>
              <Input label="Cartão (opcional)" placeholder="Ex: Nubank, Itaú..." value={form.card} onChange={e => handleFormChange('card', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Valor total (R$)" type="number" step="0.01" placeholder="1200,00" value={form.total_amount} onChange={e => handleFormChange('total_amount', e.target.value)} required />
              <Input label="Nº de parcelas" type="number" placeholder="12" value={form.total_installments} onChange={e => handleFormChange('total_installments', e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Input label="Valor/parcela (R$)" type="number" step="0.01" value={form.installment_value} onChange={e => handleFormChange('installment_value', e.target.value)} required />
              <Input label="Parcelas já pagas" type="number" min="0" value={form.paid_installments} onChange={e => handleFormChange('paid_installments', e.target.value)} />
              <Input label="Início (1ª parcela)" type="date" value={form.start_date} onChange={e => handleFormChange('start_date', e.target.value)} required />
            </div>

            {form.total_amount && form.total_installments && (
              <div style={{ background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 12, padding: '12px 14px', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Parcela calculada: </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: '#63b3ed' }}>
                  {BRL(parseFloat(form.total_amount || 0) / parseInt(form.total_installments || 1))}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>× {form.total_installments}x</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <Btn variant="ghost" type="button" onClick={() => { setModal(false); setForm(FORM_DEFAULT) }}>Cancelar</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
