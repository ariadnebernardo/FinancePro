import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, Legend,
} from 'recharts'
import { Card, KPI, Btn, Input, SelectField, Modal, Spinner, Badge, TooltipContent } from '../components/ui'
import { BRL, PCT, MONTHS_BR, PALETTE, SEGMENTS, INV_TYPES, SEGMENT_COLORS, lastNMonths, monthLabel } from '../lib/utils'

const TABS = ['carteira', 'dividendos', 'simulador', 'agenda']
const TAB_LABELS = { carteira: '🗂 Carteira', dividendos: '💸 Dividendos', simulador: '🔮 Simulador', agenda: '📅 Agenda' }

// ── helpers ──────────────────────────────────────────────────────────────────
function assetDivs(asset, dividends) {
  return dividends.filter(d => d.asset_id === asset.id)
}
function lastDivPerCota(asset, dividends) {
  const divs = assetDivs(asset, dividends).sort((a, b) => a.month < b.month ? 1 : -1)
  return divs[0]?.valor_por_cota ?? 0
}
function annualDY(asset, dividends) {
  const last12 = assetDivs(asset, dividends).slice(-12)
  const sum = last12.reduce((s, d) => s + Number(d.valor_por_cota), 0)
  return asset.preco_atual > 0 ? (sum / Number(asset.preco_atual)) * 100 : 0
}

// ── Carteira ─────────────────────────────────────────────────────────────────
function Carteira({ assets, dividends, loading, onAdd, onUpdate, onRemove }) {
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({ ticker: '', name: '', type: 'FII', segment: 'Logístico', cotas: '', preco_medio: '', preco_atual: '' })

  const totalInvested = assets.reduce((s, a) => s + Number(a.cotas) * Number(a.preco_medio), 0)
  const totalCurrent  = assets.reduce((s, a) => s + Number(a.cotas) * Number(a.preco_atual), 0)
  const totalReturn   = totalCurrent - totalInvested
  const totalDivLast  = assets.reduce((s, a) => s + lastDivPerCota(a, dividends) * Number(a.cotas), 0)

  function openAdd() {
    setForm({ ticker: '', name: '', type: 'FII', segment: 'Logístico', cotas: '', preco_medio: '', preco_atual: '' })
    setEditing(null); setModal(true)
  }
  function openEdit(a) {
    setForm({ ticker: a.ticker, name: a.name, type: a.type, segment: a.segment, cotas: a.cotas, preco_medio: a.preco_medio, preco_atual: a.preco_atual })
    setEditing(a.id); setModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, cotas: +form.cotas, preco_medio: +form.preco_medio, preco_atual: +form.preco_atual }
    if (editing) await onUpdate(editing, payload)
    else await onAdd(payload)
    setSaving(false); setModal(false)
  }

  const byType = INV_TYPES.map(t => ({
    name: t, value: assets.filter(a => a.type === t).reduce((s, a) => s + Number(a.cotas) * Number(a.preco_atual), 0)
  })).filter(d => d.value > 0)

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        <KPI label="Total investido"   value={BRL(totalInvested, 0)} icon="💰" color="#63b3ed" sub={`${assets.length} ativos`} />
        <KPI label="Valor atual"       value={BRL(totalCurrent, 0)}  icon="📊" color="#68d391" />
        <KPI label="Resultado"         value={BRL(totalReturn, 0)}   icon={totalReturn >= 0 ? '📈' : '📉'} color={totalReturn >= 0 ? '#68d391' : '#fc8181'} sub={totalInvested > 0 ? PCT(totalReturn / totalInvested * 100) : '-'} />
        <KPI label="Dividendos últ. mês" value={BRL(totalDivLast, 0)} icon="💸" color="#f6ad55" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Minha carteira</span>
            <Btn onClick={openAdd}>+ Ativo</Btn>
          </div>
          {assets.length === 0
            ? <p style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Adicione seu primeiro ativo!</p>
            : <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Ativo', 'Tipo', 'Cotas', 'P. Médio', 'P. Atual', 'Posição', 'Result.', 'DY Anual', 'Últ. div/cota', ''].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(a => {
                      const pos  = Number(a.cotas) * Number(a.preco_atual)
                      const res  = pos - Number(a.cotas) * Number(a.preco_medio)
                      const dy   = annualDY(a, dividends)
                      const last = lastDivPerCota(a, dividends)
                      const pos_ = res >= 0
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background .15s', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,179,237,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: (SEGMENT_COLORS[a.segment] ?? '#999') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, color: SEGMENT_COLORS[a.segment] ?? '#999' }}>
                                {a.ticker.slice(0, 4)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{a.ticker}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{a.name.length > 22 ? a.name.slice(0, 22) + '…' : a.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}><Badge color={a.type === 'FII' ? 'blue' : 'amber'}>{a.type}</Badge></td>
                          <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{Number(a.cotas)}</span></td>
                          <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{BRL(a.preco_medio)}</span></td>
                          <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{BRL(a.preco_atual)}</span></td>
                          <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13 }}>{BRL(pos, 0)}</span></td>
                          <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: pos_ ? '#68d391' : '#fc8181' }}>{pos_ ? '+' : ''}{PCT(res / (Number(a.cotas) * Number(a.preco_medio)) * 100)}</span></td>
                          <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#f6ad55' }}>{PCT(dy)}</span></td>
                          <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#68d391' }}>{last ? BRL(last) : '—'}</span></td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => openEdit(a)} style={{ background: 'rgba(99,179,237,0.1)', border: 'none', color: '#63b3ed', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✏</button>
                              <button onClick={() => onRemove(a.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#fc8181', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✕</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
          }
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Por tipo</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={byType} barSize={30}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<TooltipContent />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {byType.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>DY Anual</div>
            {assets.map(a => {
              const dy = annualDY(a, dividends)
              return (
                <div key={a.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{a.ticker}</span>
                    <span style={{ fontSize: 12, color: '#f6ad55', fontFamily: "'JetBrains Mono',monospace" }}>{PCT(dy)}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 999, height: 5 }}>
                    <div style={{ width: `${Math.min(dy / 20 * 100, 100)}%`, background: 'linear-gradient(90deg,#63b3ed,#f6ad55)', borderRadius: 999, height: '100%', transition: 'width .6s' }} />
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      </div>

      {modal && (
        <Modal title={editing ? 'Editar ativo' : 'Novo ativo'} onClose={() => setModal(false)}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Ticker" placeholder="HGLG11" value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} required />
              <SelectField label="Tipo" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {INV_TYPES.map(t => <option key={t}>{t}</option>)}
              </SelectField>
            </div>
            <Input label="Nome completo" placeholder="CSHG Logística FII" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <SelectField label="Segmento" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
              {SEGMENTS.map(s => <option key={s}>{s}</option>)}
            </SelectField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Input label="Cotas" type="number" step="0.0001" placeholder="100" value={form.cotas} onChange={e => setForm(f => ({ ...f, cotas: e.target.value }))} required />
              <Input label="P. Médio (R$)" type="number" step="0.01" placeholder="162.40" value={form.preco_medio} onChange={e => setForm(f => ({ ...f, preco_medio: e.target.value }))} required />
              <Input label="P. Atual (R$)" type="number" step="0.01" placeholder="168.50" value={form.preco_atual} onChange={e => setForm(f => ({ ...f, preco_atual: e.target.value }))} required />
            </div>
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

// ── Dividendos ────────────────────────────────────────────────────────────────
function Dividendos({ assets, dividends, onUpsert }) {
  const [modal, setModal]   = useState(false)
  const [selId, setSelId]   = useState(assets[0]?.id ?? '')
  const [form, setForm]     = useState({ month: '', valor_por_cota: '', data_com: '', data_pag: '' })
  const [saving, setSaving] = useState(false)

  const months12 = lastNMonths(12)
  const monthlyData = months12.map(m => {
    const row = { name: MONTHS_BR[parseInt(m.split('-')[1]) - 1], month: m }
    let total = 0
    assets.forEach(a => {
      const div = dividends.find(d => d.asset_id === a.id && d.month === m)
      const v = div ? Number(div.valor_por_cota) * Number(a.cotas) : 0
      row[a.ticker] = v
      total += v
    })
    row.total = total
    return row
  })

  const totalAnual = monthlyData.reduce((s, d) => s + d.total, 0)
  const mediasMes  = totalAnual / 12
  const melhor     = [...monthlyData].sort((a, b) => b.total - a.total)[0]

  const allDivs = assets.flatMap(a =>
    dividends.filter(d => d.asset_id === a.id).map(d => ({
      ...d, ticker: a.ticker, cotas: Number(a.cotas),
      total: Number(d.valor_por_cota) * Number(a.cotas),
    }))
  ).sort((a, b) => b.month.localeCompare(a.month))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await onUpsert({ asset_id: selId, ...form, valor_por_cota: +form.valor_por_cota })
    setSaving(false); setModal(false)
    setForm({ month: '', valor_por_cota: '', data_com: '', data_pag: '' })
  }

  const previewTotal = selId && form.valor_por_cota
    ? Number(form.valor_por_cota) * Number(assets.find(a => a.id === selId)?.cotas ?? 0)
    : 0

  const COLS = ['#63b3ed','#f6ad55','#68d391','#b794f4','#fc8181','#4fd1c5']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <KPI label="Proventos anuais" value={BRL(totalAnual, 0)} icon="📆" color="#68d391" />
        <KPI label="Média mensal"     value={BRL(mediasMes, 0)} icon="📊" color="#63b3ed" />
        <KPI label="Melhor mês"       value={melhor?.total > 0 ? BRL(melhor.total, 0) : '—'} icon="🏆" color="#f6ad55" sub={melhor?.name} />
        <KPI label="Ativos pagadores" value={assets.filter(a => dividends.some(d => d.asset_id === a.id)).length} icon="💼" color="#b794f4" sub={`de ${assets.length}`} />
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Renda passiva — últimos 12 meses</span>
          <Btn onClick={() => setModal(true)}>+ Registrar dividendo</Btn>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v.toFixed(0)}`} />
            <Tooltip content={<TooltipContent />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }} />
            {assets.map((a, i) => (
              <Bar key={a.id} dataKey={a.ticker} name={a.ticker} stackId="a" fill={COLS[i % COLS.length]}
                radius={i === assets.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* History table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: 15 }}>Histórico de proventos</div>
        {allDivs.length === 0
          ? <p style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Nenhum provento registrado ainda.</p>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Ativo', 'Mês', 'Valor/cota', 'Cotas', 'Total', 'Data-com', 'Pagamento'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allDivs.slice(0, 40).map((d, i) => (
                    <tr key={d.id ?? i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13 }}>{d.ticker}</td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{d.month}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#68d391' }}>{BRL(d.valor_por_cota)}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{d.cotas}</span></td>
                      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: '#f6ad55' }}>{BRL(d.total)}</span></td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{d.data_com ?? '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12 }}>{d.data_pag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </Card>

      {modal && (
        <Modal title="Registrar dividendo" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SelectField label="Ativo" value={selId} onChange={e => setSelId(e.target.value)}>
              {assets.map(a => <option key={a.id} value={a.id}>{a.ticker} — {a.name}</option>)}
            </SelectField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Mês de referência" type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} required />
              <Input label="Valor por cota (R$)" type="number" step="0.000001" placeholder="1.05" value={form.valor_por_cota} onChange={e => setForm(f => ({ ...f, valor_por_cota: e.target.value }))} required />
              <Input label="Data-com" type="date" value={form.data_com} onChange={e => setForm(f => ({ ...f, data_com: e.target.value }))} />
              <Input label="Data de pagamento" type="date" value={form.data_pag} onChange={e => setForm(f => ({ ...f, data_pag: e.target.value }))} required />
            </div>
            {previewTotal > 0 && (
              <div style={{ background: 'rgba(104,211,145,0.08)', border: '1px solid rgba(104,211,145,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Você receberá: </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: '#68d391', fontSize: 16 }}>{BRL(previewTotal)}</span>
              </div>
            )}
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

// ── Simulador ─────────────────────────────────────────────────────────────────
function Simulador({ assets, dividends }) {
  const [simCotas, setSimCotas] = useState(() => Object.fromEntries(assets.map(a => [a.id, Number(a.cotas)])))
  const [months, setMonths]     = useState(12)
  const [reinvest, setReinvest] = useState(false)

  const COLS = ['#63b3ed','#f6ad55','#68d391','#b794f4','#fc8181','#4fd1c5']

  const months_arr = useMemo(() => Array.from({ length: months }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() + i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }), [months])

  const simData = useMemo(() => {
    const extra = Object.fromEntries(assets.map(a => [a.id, 0]))
    return months_arr.map(m => {
      const row = { name: MONTHS_BR[parseInt(m.split('-')[1]) - 1] + ' ' + m.split('-')[0], month: m }
      let total = 0
      assets.forEach((a, i) => {
        const cotas = (simCotas[a.id] ?? 0) + (reinvest ? extra[a.id] : 0)
        const last  = dividends.filter(d => d.asset_id === a.id).sort((a, b) => b.month.localeCompare(a.month))[0]
        const dpc   = Number(last?.valor_por_cota ?? 0)
        const value = dpc * cotas
        row[a.ticker] = value
        total += value
        if (reinvest && dpc > 0 && Number(a.preco_atual) > 0) extra[a.id] += value / Number(a.preco_atual)
      })
      row.total = total
      return row
    })
  }, [assets, dividends, simCotas, months, reinvest])

  const simTotal  = simData.reduce((s, d) => s + d.total, 0)
  const simMedio  = simTotal / months
  const simMelhor = Math.max(...simData.map(d => d.total), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controls */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>⚙️ Configurar simulação</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20, alignItems: 'end' }}>
          {assets.map(a => (
            <div key={a.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.ticker}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#63b3ed' }}>{simCotas[a.id] ?? 0} cotas</span>
              </div>
              <input type="range" min={0} max={Math.max(1000, (simCotas[a.id] ?? 0) * 3)} step={1}
                value={simCotas[a.id] ?? 0}
                onChange={e => setSimCotas(prev => ({ ...prev, [a.id]: +e.target.value }))}
                style={{ width: '100%', accentColor: '#63b3ed' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                <span>0</span><span>{Math.max(1000, (simCotas[a.id] ?? 0) * 3)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#f6ad55', marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                ≈ {BRL(Number(lastDivPerCota(a, dividends)) * (simCotas[a.id] ?? 0))}/mês
              </div>
            </div>
          ))}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Horizonte</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#63b3ed' }}>{months} meses</span>
            </div>
            <input type="range" min={1} max={60} value={months} onChange={e => setMonths(+e.target.value)} style={{ width: '100%', accentColor: '#63b3ed' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
              <span>1</span><span>60</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setReinvest(r => !r)}
              style={{ width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', transition: 'all .3s', background: reinvest ? '#68d391' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 3, left: reinvest ? 23 : 3, width: 18, height: 18, background: 'white', borderRadius: 999, transition: 'left .3s' }} />
            </button>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Reinvestir dividendos</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Compõe cotas ao longo do tempo</div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <KPI label={`Total em ${months} meses`} value={BRL(simTotal, 0)} icon="💰" color="#68d391" />
        <KPI label="Média mensal estimada"      value={BRL(simMedio, 0)} icon="📊" color="#63b3ed" />
        <KPI label="Melhor mês estimado"        value={BRL(simMelhor, 0)} icon="🏆" color="#f6ad55" />
      </div>

      <Card>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          Projeção mensal de dividendos
          {reinvest && <span style={{ fontSize: 12, color: '#68d391', marginLeft: 10 }}>📈 com reinvestimento</span>}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={simData} barSize={Math.max(6, 40 - months)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v.toFixed(0)}`} />
            <Tooltip content={<TooltipContent />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }} />
            {assets.map((a, i) => (
              <Bar key={a.id} dataKey={a.ticker} name={a.ticker} stackId="a" fill={COLS[i % COLS.length]}
                radius={i === assets.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detail table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: 15 }}>Detalhamento mensal</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>Mês</th>
                {assets.map(a => <th key={a.id} style={{ padding: '8px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{a.ticker}</th>)}
                <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#68d391' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {simData.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>{d.name}</td>
                  {assets.map(a => (
                    <td key={a.id} style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: (d[a.ticker] ?? 0) > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
                        {(d[a.ticker] ?? 0) > 0 ? BRL(d[a.ticker]) : '—'}
                      </span>
                    </td>
                  ))}
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14, color: '#68d391' }}>{BRL(d.total)}</span>
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid rgba(255,255,255,0.12)', background: 'rgba(104,211,145,0.04)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700 }}>TOTAL</td>
                {assets.map(a => (
                  <td key={a.id} style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: '#f6ad55' }}>
                      {BRL(simData.reduce((s, d) => s + (d[a.ticker] ?? 0), 0))}
                    </span>
                  </td>
                ))}
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 16, color: '#68d391' }}>{BRL(simTotal)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ── Agenda ────────────────────────────────────────────────────────────────────
function Agenda({ assets, dividends }) {
  const [selMonth, setSelMonth] = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })

  const agenda = assets.flatMap(a => {
    const div = dividends.find(d => d.asset_id === a.id && d.month === selMonth)
    if (!div) return []
    return [{ ...div, ticker: a.ticker, name: a.name, cotas: Number(a.cotas), total: Number(div.valor_por_cota) * Number(a.cotas), color: SEGMENT_COLORS[a.segment] ?? '#63b3ed' }]
  }).sort((a, b) => (a.data_pag ?? '').localeCompare(b.data_pag ?? ''))

  const totalMes = agenda.reduce((s, d) => s + d.total, 0)

  const [y, m] = selMonth.split('-')
  const prev_ = () => { const d = new Date(+y, +m - 2, 1); setSelMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) }
  const next_ = () => { const d = new Date(+y, +m, 1); setSelMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={prev_} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#e2e8f0', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 20, minWidth: 160, textAlign: 'center' }}>{monthLabel(selMonth)}</span>
        <button onClick={next_} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#e2e8f0', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>›</button>
        {totalMes > 0 && <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, color: '#68d391' }}>{BRL(totalMes)}</span>}
      </div>

      {agenda.length === 0
        ? <Card style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Nenhum provento em {monthLabel(selMonth)}.</p>
          </Card>
        : <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
              {agenda.map((d, i) => (
                <Card key={i} style={{ borderLeft: `4px solid ${d.color}`, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{d.ticker}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{d.name}</div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 22, color: d.color }}>{BRL(d.total)}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'VALOR/COTA', value: BRL(d.valor_por_cota), color: '#68d391' },
                      { label: 'DATA-COM',   value: d.data_com ?? '—', color: '#e2e8f0' },
                      { label: 'PAGAMENTO',  value: d.data_pag, color: '#63b3ed' },
                    ].map(item => (
                      <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono',monospace" }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    Você possui <span style={{ color: 'white', fontWeight: 600 }}>{d.cotas} cotas</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Timeline */}
            <Card>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📅 Linha do tempo</div>
              {agenda.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color, marginTop: 4, flexShrink: 0 }} />
                    {i < agenda.length - 1 && <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.07)', marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingBottom: i < agenda.length - 1 ? 20 : 0, flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Pag. {d.data_pag}{d.data_com ? ` · Data-com ${d.data_com}` : ''}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{d.ticker}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: '#68d391' }}>{BRL(d.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </>
      }
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function InvestmentsPage({ assets, dividends, loading, onAddAsset, onUpdateAsset, onRemoveAsset, onUpsertDividend }) {
  const [tab, setTab] = useState('carteira')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600,
              borderBottom: tab === t ? '2px solid #63b3ed' : '2px solid transparent',
              color: tab === t ? '#63b3ed' : 'rgba(255,255,255,0.4)',
              marginBottom: -1, transition: 'all .2s',
            }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'carteira'   && <Carteira   assets={assets} dividends={dividends} loading={loading} onAdd={onAddAsset} onUpdate={onUpdateAsset} onRemove={onRemoveAsset} />}
      {tab === 'dividendos' && <Dividendos assets={assets} dividends={dividends} onUpsert={onUpsertDividend} />}
      {tab === 'simulador'  && <Simulador  assets={assets} dividends={dividends} />}
      {tab === 'agenda'     && <Agenda     assets={assets} dividends={dividends} />}
    </div>
  )
}
