import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getCurrentMonth, monthLabel, prevMonth, nextMonth } from '../../lib/utils'

const NAV = [
  { id: 'dashboard',    icon: '🏠', label: 'Dashboard'     },
  { id: 'transactions', icon: '💸', label: 'Transações'    },
  { id: 'investments',  icon: '📈', label: 'Investimentos' },
  { id: 'planning',     icon: '🎯', label: 'Planejamento'  },
  { id: 'reports',      icon: '📊', label: 'Relatórios'    },
]

export default function Layout({ children, page, onChangePage }) {
  const { user, signOut } = useAuth()
  const [month, setMonth] = useState(getCurrentMonth())

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: 60, padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'rgba(11,15,26,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#63b3ed,#68d391)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💰</div>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#e2e8f0' }}>FinançasPro</span>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button onClick={() => setMonth(m => prevMonth(m))} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#e2e8f0', width: 32, height: 32, borderRadius: 9, cursor: 'pointer', fontSize: 16 }}>‹</button>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0', minWidth: 100, textAlign: 'center' }}>{monthLabel(month)}</span>
          <button onClick={() => setMonth(m => nextMonth(m))} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#e2e8f0', width: 32, height: 32, borderRadius: 9, cursor: 'pointer', fontSize: 16 }}>›</button>
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#63b3ed,#b794f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <button onClick={signOut} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", fontSize: 12 }}>
            Sair
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <nav style={{ width: 200, padding: '16px 12px', borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => onChangePage(n.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                marginBottom: 4, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 600,
                textAlign: 'left', transition: 'all .15s',
                background: page === n.id ? 'rgba(99,179,237,0.1)' : 'transparent',
                color: page === n.id ? '#63b3ed' : 'rgba(255,255,255,0.45)',
                borderLeft: page === n.id ? '2px solid #63b3ed' : '2px solid transparent',
              }}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        {/* Main */}
        <main style={{ flex: 1, padding: '24px 28px', overflowX: 'hidden' }}>
          {typeof children === 'function' ? children({ month }) : children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(11,15,26,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
        className="mobile-nav"
      >
        {NAV.map(n => (
          <button key={n.id} onClick={() => onChangePage(n.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
              color: page === n.id ? '#63b3ed' : 'rgba(255,255,255,0.35)',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: 10, fontWeight: 600, gap: 3,
            }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            {n.label.split(' ')[0]}
          </button>
        ))}
      </nav>
    </div>
  )
}
