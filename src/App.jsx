import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Transactions from './pages/Transactions'
import AskAI from './pages/AskAI'
import './App.css'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',    icon: '⊞' },
  { key: 'transactions', label: 'Transactions', icon: '💳' },
  { key: 'upload',       label: 'Upload',       icon: '📤' },
  { key: 'askai',        label: 'Ask AI',       icon: '🤖' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const isMobile = useIsMobile()

  const pages = {
    dashboard:    <Dashboard setPage={setPage} isMobile={isMobile} />,
    upload:       <Upload isMobile={isMobile} />,
    transactions: <Transactions isMobile={isMobile} />,
    askai:        <AskAI isMobile={isMobile} />,
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f3f4f6' }}>

        {/* Mobile header */}
        <div style={{ background: '#111827', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 20, height: 20, background: '#e24b4a', borderRadius: 4 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>RestoTrack</span>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {pages[page]}
        </div>

        {/* Bottom tab bar — prominent and clear */}
        <div style={{
          display: 'flex',
          background: 'white',
          borderTop: '2px solid #e8e6e1',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          flexShrink: 0,
        }}>
          {NAV_ITEMS.map(item => (
            <div
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 0 8px',
                cursor: 'pointer',
                color: page === item.key ? '#e24b4a' : '#6b7280',
                background: page === item.key ? '#fff5f5' : 'white',
                borderTop: page === item.key ? '2px solid #e24b4a' : '2px solid transparent',
                marginTop: -2,
              }}
            >
              <span style={{ fontSize: 22, marginBottom: 3 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: page === item.key ? 700 : 400 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: 210, background: '#111827', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, background: '#e24b4a', borderRadius: 5 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>RestoTrack</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map(item => (
            <div
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 16px', fontSize: 12, cursor: 'pointer',
                color: page === item.key ? 'white' : 'rgba(255,255,255,0.5)',
                borderLeft: page === item.key ? '2px solid #e24b4a' : '2px solid transparent',
                background: page === item.key ? 'rgba(226,75,74,0.1)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 16px', borderTop: '0.5px solid rgba(255,255,255,0.07)', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
          v2.1 · RestoTrack
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#f3f4f6' }}>
        {pages[page]}
      </div>
    </div>
  )
}
