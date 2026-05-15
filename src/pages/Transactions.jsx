import { useState, useEffect } from 'react'
import RightPanel from '../components/transactions/RightPanel'
import {
  getWorkflowConfig, getCategoryIcon,
  isMissing, isMatched, isOrphan, isReview, isRefund, isWaived, getUrgency
} from '../components/transactions/workflowConfig'

const API = 'https://restaurant-accountability-system.onrender.com'

export default function Transactions({ isMobile }) {
  const [insights,     setInsights]     = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState(null)
  const [filter,       setFilter]       = useState('all')
  const [search,       setSearch]       = useState('')
  const [selectedIds,  setSelectedIds]  = useState(new Set())
  const [showExport,   setShowExport]   = useState(false)
  const [exportFrom,   setExportFrom]   = useState('')
  const [exportTo,     setExportTo]     = useState('')
  const [exporting,    setExporting]    = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [insRes, txnRes] = await Promise.all([
        fetch(`${API}/insights`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API}/transactions`).then(r => r.json()).catch(() => ({ data: [] })),
      ])
      setInsights(insRes.data || [])
      setTransactions(txnRes.data || [])
    } catch {}
    setLoading(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      let url = `${API}/audit-report`
      const params = []
      if (exportFrom) params.push(`from_date=${exportFrom}`)
      if (exportTo)   params.push(`to_date=${exportTo}`)
      if (params.length) url += '?' + params.join('&')
      const res  = await fetch(url)
      const blob = await res.blob()
      const a    = document.createElement('a')
      a.href     = URL.createObjectURL(blob)
      a.download = `restotrack_audit${exportFrom ? '_' + exportFrom : ''}.csv`
      a.click()
      setShowExport(false)
    } catch {
      alert('Export failed.')
    }
    setExporting(false)
  }

  // Build unified list
  const insightByTxnId = {}
  insights.forEach(i => { if (i.transaction?.id) insightByTxnId[i.transaction.id] = i })

  const orphanRows = insights.filter(i => i.type === 'match' && isOrphan(i.status))

  const txnRows = transactions.map(t => {
    const insight = insightByTxnId[t.id] || {}
    return {
      txn_id: t.id, match_id: insight.match_id || null,
      type: insight.type || 'missing_receipt',
      vendor: insight.vendor || t.merchant,
      amount: insight.amount ?? t.amount,
      transaction_date: insight.transaction_date || t.transaction_date,
      category: t.category,
      status: insight.status || 'pending_receipt',
      days_pending: insight.days_pending || 0,
      priority: insight.priority || 'high',
      scenario_type: insight.scenario_type || null,
      clarification_required: insight.clarification_required || false,
      clarification_type: insight.clarification_type || null,
      score: insight.score || 0,
      transaction: insight.transaction || { id: t.id, merchant: t.merchant, amount: t.amount, date: t.transaction_date, category: t.category },
      receipt: insight.receipt || null,
      workflow: insight.workflow || {},
      assigned_to: insight.assigned_to,
      assigned_at: insight.assigned_at,
      reviewer_notes: insight.reviewer_notes,
      resolution_action: insight.resolution_action,
    }
  })

  const orphanItems = orphanRows.map(i => ({
    txn_id: i.match_id, match_id: i.match_id, type: 'match',
    vendor: i.vendor, amount: i.amount,
    transaction_date: i.transaction_date || i.receipt?.date,
    category: 'other', status: i.status,
    days_pending: i.days_pending || 0, priority: i.priority || 'low',
    scenario_type: i.scenario_type, clarification_required: false,
    clarification_type: null, score: i.score || 0,
    transaction: null, receipt: i.receipt, workflow: i.workflow || {},
    assigned_to: i.assigned_to, assigned_at: i.assigned_at,
    reviewer_notes: i.reviewer_notes, resolution_action: i.resolution_action,
  }))

  const allItems = [...txnRows, ...orphanItems]

  const counts = {
    missing: allItems.filter(i => isMissing(i.status) && !isRefund(i.amount)).length,
    review:  allItems.filter(i => isReview(i.status)).length,
    orphan:  allItems.filter(i => isOrphan(i.status)).length,
    refunds: allItems.filter(i => isRefund(i.amount)).length,
    matched: allItems.filter(i => isMatched(i.status)).length,
    waived:  allItems.filter(i => isWaived(i.status)).length,
  }

  const totalSpend   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalCredits = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)

  let filtered = allItems.filter(i => {
    if (search && !(i.vendor || '').toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'missing') return isMissing(i.status) && !isRefund(i.amount)
    if (filter === 'review')  return isReview(i.status)
    if (filter === 'orphan')  return isOrphan(i.status)
    if (filter === 'refunds') return isRefund(i.amount)
    if (filter === 'matched') return isMatched(i.status)
    if (filter === 'waived')  return isWaived(i.status)
    return true
  })

  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  filtered = [...filtered].sort((a, b) => {
    if (isWaived(a.status) && !isWaived(b.status)) return 1
    if (!isWaived(a.status) && isWaived(b.status)) return -1
    return (urgencyOrder[getUrgency(a.days_pending || 0)] ?? 4) - (urgencyOrder[getUrgency(b.days_pending || 0)] ?? 4)
  })

  function toggleSelect(id, e) {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', fontSize: 13 }}>
      Loading transactions...
    </div>
  )

  // ── MOBILE RIGHT PANEL (full screen bottom sheet) ─────────
  if (isMobile && selected) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'white', display: 'flex', flexDirection: 'column', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <RightPanel
          item={selected}
          onClose={() => setSelected(null)}
          onRefresh={loadData}
          isMobile={true}
        />
      </div>
    )
  }

  // ── MOBILE LAYOUT ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

        {/* Export modal */}
        {showExport && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 100 }}>
            <div style={{ background: 'white', borderRadius: '16px 16px 0 0', padding: 24, width: '100%' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Export Audit Report</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Download all transactions as CSV</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>From date</div>
                <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 8, padding: '10px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>To date</div>
                <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 8, padding: '10px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowExport(false)} style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleExport} disabled={exporting} style={{ flex: 1, background: '#111827', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                  {exporting ? 'Exporting...' : '⬇ Download'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div style={{ background: 'white', padding: '12px 16px', borderBottom: '0.5px solid #e8e6e1', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Transactions</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{transactions.length} · ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowExport(true)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>⬇</button>
              <button onClick={loadData} style={{ background: '#111827', color: 'white', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>↻</button>
            </div>
          </div>

          {/* Attention strip — 2x3 grid on mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
            {[
              { key: 'missing', label: 'Missing',  icon: '🧾', color: '#fee2e2', count: counts.missing  },
              { key: 'review',  label: 'Review',   icon: '⚠️',  color: '#fef3c7', count: counts.review   },
              { key: 'orphan',  label: 'Orphan',   icon: '🔍',  color: '#ede9fe', count: counts.orphan   },
              { key: 'refunds', label: 'Refunds',  icon: '↩️',  color: '#ccfbf1', count: counts.refunds  },
              { key: 'matched', label: 'Matched',  icon: '✅',  color: '#d1fae5', count: counts.matched  },
              { key: 'waived',  label: 'Waived',   icon: '📋',  color: '#f3f4f6', count: counts.waived   },
            ].map(a => (
              <div key={a.key} onClick={() => setFilter(filter === a.key ? 'all' : a.key)} style={{
                background: filter === a.key ? '#111827' : a.color,
                borderRadius: 8, padding: '8px 6px',
                textAlign: 'center', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: filter === a.key ? 'white' : '#111827' }}>{a.count}</div>
                <div style={{ fontSize: 9, color: filter === a.key ? 'rgba(255,255,255,0.7)' : '#6b7280', marginTop: 1 }}>{a.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f8f7', borderRadius: 8, padding: '8px 12px' }}>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search merchant..." style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', flex: 1 }} />
          </div>
        </div>

        {/* Banners */}
        {counts.waived > 0 && (
          <div style={{ margin: '8px 16px 0', background: '#fafafa', border: '0.5px solid #e8e6e1', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#374151' }}>
            📋 {counts.waived} manually closed — review for audit compliance
          </div>
        )}
        {counts.refunds > 0 && filter !== 'refunds' && (
          <div style={{ margin: '8px 16px 0', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#065f46' }}>
            ↩️ {counts.refunds} credits totalling ${Math.abs(totalCredits).toFixed(2)}
          </div>
        )}

        {/* Transaction cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
          {filtered.map((item, i) => {
            const cfg    = getWorkflowConfig(item.status, item.days_pending || 0)
            const refund = isRefund(item.amount)
            const waived = isWaived(item.status)
            const urgency = getUrgency(item.days_pending || 0)

            return (
              <div key={`${item.txn_id}-${i}`}
                onClick={() => setSelected(item)}
                style={{
                  background: 'white', borderRadius: 12, padding: '12px 14px',
                  marginBottom: 8, cursor: 'pointer',
                  border: '0.5px solid #e8e6e1',
                  opacity: waived ? 0.7 : 1,
                  borderLeft: `3px solid ${cfg.dot}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f8f8f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {getCategoryIcon(item.category)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: waived ? '#9ca3af' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                        {item.vendor}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                        {item.category} · {(item.transaction_date || item.receipt?.date)?.slice(5,10)}
                        {urgency === 'critical' && isMissing(item.status) && !refund && (
                          <span style={{ color: '#dc2626', fontWeight: 500 }}> · Overdue {item.days_pending}d</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: refund ? '#059669' : waived ? '#9ca3af' : '#111827' }}>
                      {refund ? '-' : ''}${Math.abs(item.amount || 0).toFixed(2)}
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, fontWeight: 500, background: refund ? '#ccfbf1' : cfg.bg, color: refund ? '#065f46' : cfg.color }}>
                      {refund ? 'Refund' : cfg.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── DESKTOP LAYOUT (unchanged) ────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {showExport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Export Audit Report</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Download all transactions as CSV. Leave blank to export everything.</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>From date</div>
              <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>To date</div>
              <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowExport(false)} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 7, padding: '9px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleExport} disabled={exporting} style={{ flex: 1, background: '#111827', color: 'white', border: 'none', borderRadius: 7, padding: '9px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {exporting ? 'Exporting...' : '⬇ Download CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '12px 18px', background: 'white', borderBottom: '0.5px solid #e8e6e1', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Transactions</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
              {transactions.length} transactions · ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
              {totalCredits < 0 && ` · $${Math.abs(totalCredits).toFixed(2)} in credits`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowExport(true)} style={{ background: 'white', color: '#374151', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>⬇ Export</button>
            <button onClick={loadData} style={{ background: '#111827', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>↻ Refresh</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, padding: '10px 18px', background: 'white', borderBottom: '0.5px solid #e8e6e1', flexShrink: 0 }}>
          {[
            { key: 'missing', label: 'Missing',  icon: '🧾', iconBg: '#fee2e2', count: counts.missing  },
            { key: 'review',  label: 'Review',   icon: '⚠️',  iconBg: '#fef3c7', count: counts.review   },
            { key: 'orphan',  label: 'Orphan',   icon: '🔍',  iconBg: '#ede9fe', count: counts.orphan   },
            { key: 'refunds', label: 'Refunds',  icon: '↩️',  iconBg: '#ccfbf1', count: counts.refunds  },
            { key: 'matched', label: 'Matched',  icon: '✅',  iconBg: '#d1fae5', count: counts.matched  },
            { key: 'waived',  label: 'Waived',   icon: '📋',  iconBg: '#f3f4f6', count: counts.waived   },
          ].map(a => (
            <div key={a.key} onClick={() => setFilter(filter === a.key ? 'all' : a.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: filter === a.key ? '#f0f0f0' : '#f8f8f7', border: `0.5px solid ${filter === a.key ? '#374151' : '#e8e6e1'}`, borderRadius: 9, padding: '8px 10px', cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{a.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: a.count > 0 ? '#111827' : '#9ca3af' }}>{a.count}</div>
                <div style={{ fontSize: 9, color: '#9ca3af', lineHeight: 1.2 }}>{a.label}</div>
              </div>
            </div>
          ))}
        </div>

        {counts.waived > 0 && filter !== 'waived' && (
          <div onClick={() => setFilter('waived')} style={{ margin: '8px 18px 0', background: '#fafafa', border: '0.5px solid #e8e6e1', borderRadius: 9, padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>📋 {counts.waived} transaction{counts.waived > 1 ? 's' : ''} manually closed — review for audit compliance</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Review →</span>
          </div>
        )}

        {counts.refunds > 0 && filter !== 'refunds' && filter !== 'waived' && (
          <div onClick={() => setFilter('refunds')} style={{ margin: '8px 18px 0', background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 9, padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#065f46', fontWeight: 500 }}>↩️ {counts.refunds} credit{counts.refunds > 1 ? 's' : ''} totalling ${Math.abs(totalCredits).toFixed(2)} — verify these are accounted for</span>
            <span style={{ fontSize: 11, color: '#059669' }}>View →</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'white', borderBottom: '0.5px solid #e8e6e1', flexShrink: 0, marginTop: 8, flexWrap: 'wrap' }}>
          {['all', 'missing', 'review', 'orphan', 'refunds', 'matched', 'waived'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 11, padding: '4px 11px', borderRadius: 99, border: `0.5px solid ${filter === f ? '#111827' : '#e8e6e1'}`, background: filter === f ? '#111827' : 'white', color: filter === f ? 'white' : '#6b7280', cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
              {f === 'all' ? `All (${allItems.length})` : f}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#f8f8f7', border: '0.5px solid #e8e6e1', borderRadius: 7, padding: '5px 10px' }}>
            <svg width="11" height="11" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search merchant..." style={{ border: 'none', background: 'transparent', fontSize: 11, outline: 'none', width: 150, color: '#111827' }} />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div style={{ padding: '8px 18px', background: '#111827', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>{selectedIds.size} selected</span>
            <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>Bulk resolve</button>
            <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer' }}>Bulk escalate</button>
            <button onClick={() => setSelectedIds(new Set())} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11 }}>Clear</button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8f8f7' }}>
              <tr>
                <th style={{ width: 40, padding: '9px 0 9px 18px' }}>
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={() => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(i => i.txn_id)))} style={{ cursor: 'pointer' }} />
                </th>
                {['Merchant', 'Category', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500, textAlign: 'left', padding: '9px 10px', borderBottom: '0.5px solid #e8e6e1', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const cfg     = getWorkflowConfig(item.status, item.days_pending || 0)
                const refund  = isRefund(item.amount)
                const waived  = isWaived(item.status)
                const urgency = getUrgency(item.days_pending || 0)
                const isSel   = selected?.txn_id === item.txn_id
                const isChk   = selectedIds.has(item.txn_id)
                return (
                  <tr key={`${item.txn_id}-${i}`} onClick={() => setSelected(isSel ? null : item)} style={{ background: isSel ? '#f0f4ff' : waived ? '#fafafa' : urgency === 'critical' && isMissing(item.status) && !refund ? '#fff8f8' : 'white', borderBottom: '0.5px solid #f0efec', borderLeft: isSel ? '2px solid #4f46e5' : '2px solid transparent', cursor: 'pointer', opacity: waived ? 0.7 : 1 }}>
                    <td style={{ padding: '10px 0 10px 18px' }} onClick={e => toggleSelect(item.txn_id, e)}>
                      <input type="checkbox" checked={isChk} onChange={() => {}} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 5, height: 32, borderRadius: 99, background: cfg.dot, flexShrink: 0 }} />
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f8f8f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{getCategoryIcon(item.category)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: waived ? '#9ca3af' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{item.vendor}</div>
                          {waived && item.resolution_action && <div style={{ fontSize: 10, color: '#9ca3af' }}>{item.resolution_action.replace(/_/g, ' ')}</div>}
                          {urgency === 'critical' && isMissing(item.status) && !refund && <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 500 }}>Overdue — {item.days_pending}d</div>}
                          {isOrphan(item.status) && <div style={{ fontSize: 10, color: '#8b5cf6' }}>No transaction found</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: '#9ca3af', padding: '10px' }}>{item.category || '—'}</td>
                    <td style={{ fontSize: 12, fontWeight: 500, color: refund ? '#059669' : waived ? '#9ca3af' : '#111827', padding: '10px' }}>{refund ? '-' : ''}${Math.abs(item.amount || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, fontWeight: 500, background: refund ? '#ccfbf1' : cfg.bg, color: refund ? '#065f46' : cfg.color, whiteSpace: 'nowrap' }}>{refund ? 'Refund' : cfg.label}</span>
                    </td>
                    <td style={{ fontSize: 11, color: '#9ca3af', padding: '10px', whiteSpace: 'nowrap' }}>{(item.transaction_date || item.receipt?.date)?.slice(5, 10) || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <RightPanel item={selected} onClose={() => setSelected(null)} onRefresh={loadData} />
      )}
    </div>
  )
}
