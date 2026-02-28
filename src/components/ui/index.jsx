// ── Shared UI primitives ──────────────────────────────────────────────────────

export function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function KPI({ label, value, sub, color = '#63b3ed', icon }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {sub && (
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
              borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: `${color}22`, color,
            }}
          >
            {sub}
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.5 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
    </Card>
  )
}

export function Btn({ children, variant = 'primary', onClick, style = {}, disabled = false, type = 'button' }) {
  const base = {
    padding: '9px 18px', borderRadius: 10, fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'all .2s', opacity: disabled ? 0.5 : 1, ...style,
  }
  const variants = {
    primary: { background: '#63b3ed', color: '#0b0f1a' },
    ghost:   { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)' },
    danger:  { background: 'rgba(239,68,68,0.12)', color: '#fc8181', border: '1px solid rgba(239,68,68,0.25)' },
    green:   { background: 'rgba(104,211,145,0.15)', color: '#68d391', border: '1px solid rgba(104,211,145,0.3)' },
  }
  return (
    <button type={type} onClick={onClick} style={{ ...base, ...variants[variant] }} disabled={disabled}>
      {children}
    </button>
  )
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </label>
      )}
      <input
        style={{
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${error ? '#fc8181' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: 14,
          fontFamily: "'Space Grotesk', sans-serif", outline: 'none', width: '100%',
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: '#fc8181' }}>{error}</span>}
    </div>
  )
}

export function SelectField({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </label>
      )}
      <select
        style={{
          background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '9px 12px', color: '#e2e8f0', fontSize: 14,
          fontFamily: "'Space Grotesk', sans-serif", outline: 'none', width: '100%',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export function Modal({ title, onClose, children, width = 440 }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: 16,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: width, background: '#111827',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: 28, boxShadow: '0 32px 80px rgba(0,0,0,.6)',
          animation: 'fadeIn .25s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(99,179,237,0.2)',
        borderTopColor: '#63b3ed',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

export function Badge({ children, color = 'blue' }) {
  const map = {
    blue:   { bg: 'rgba(99,179,237,0.15)',   fg: '#63b3ed' },
    green:  { bg: 'rgba(104,211,145,0.15)',  fg: '#68d391' },
    amber:  { bg: 'rgba(246,173,85,0.15)',   fg: '#f6ad55' },
    red:    { bg: 'rgba(252,129,129,0.15)',  fg: '#fc8181' },
    purple: { bg: 'rgba(183,148,244,0.15)',  fg: '#b794f4' },
  }
  const c = map[color] ?? map.blue
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.bg, color: c.fg }}>
      {children}
    </span>
  )
}

export function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : p.value}</p>
      ))}
    </div>
  )
}
