import { useState, useRef } from 'react'
import {
  getWorkflowConfig, getContextMessage, isMissing, isMatched,
  isOrphan, isReview, isRefund, isWaived, timeAgo, getCategoryIcon
} from './workflowConfig'

const API = 'https://restaurant-accountability-system.onrender.com'

function ContextBanner({ item }) {
  const ctx = getContextMessage(item)
  const styles = {
    success:  { bg: '#f0fdf4', border: '#bbf7d0', color: '#065f46', icon: '✅' },
    info:     { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'ℹ️' },
    warn:     { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '⚠️' },
    critical: { bg: '#fff1f2', border: '#fecdd3', color: '#991b1b', icon: '🔴' },
  }[ctx.type]
  return (
    <div style={{ background: styles.bg, border: `0.5px solid ${styles.border}`, borderRadius: 9, padding: '10px 12px', display: 'flex', gap: 8 }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{styles.icon}</span>
      <span style={{ fontSize: 12, color: styles.color, lineHeight: 1.5 }}>{ctx.msg}</span>
    </div>
  )
}

function SCard({ children, variant = 'default' }) {
  const v = {
    default: { bg: '#f8f8f7', border: '#e8e6e1' },
    warn:    { bg: '#fffbeb', border: '#fde68a' },
    success: { bg: '#f0fdf4', border: '#bbf7d0' },
    info:    { bg: '#eff6ff', border: '#bfdbfe' },
    audit:   { bg: '#fafafa', border: '#e8e6e1' },
  }[variant]
  return (
    <div style={{ background: v.bg, border: `0.5px solid ${v.border}`, borderRadius: 10, padding: '11px 13px' }}>
      {children}
    </div>
  )
}

function STitle({ children, color }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 600, color: color || '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
      {children}
    </div>
  )
}

function SRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 500, color: valueColor || '#111827' }}>{value || '—'}</span>
    </div>
  )
}

function ActionOption({ icon, iconBg, label, sub, expanded, onClick, children }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', background: 'white',
        border: `0.5px solid ${expanded ? '#111827' : '#e8e6e1'}`,
        borderRadius: expanded ? '9px 9px 0 0' : 9, cursor: 'pointer',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>{expanded ? '▾' : '›'}</span>
      </div>
      {expanded && (
        <div style={{ border: '0.5px solid #111827', borderTop: 'none', borderRadius: '0 0 9px 9px', padding: '11px 12px', background: '#f8f8f7' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function ResolveBtn({ label, onClick, disabled, color = '#059669' }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', border: 'none', borderRadius: 7, padding: '9px',
      fontSize: 12, cursor: disabled ? 'default' : 'pointer', fontWeight: 500,
      background: disabled ? '#d1d5db' : color, color: 'white', marginTop: 6,
    }}>
      {label}
    </button>
  )
}

export default function RightPanel({ item, onClose, onRefresh }) {
  const [openAction, setOpenAction] = useState(null)
  const [notes,      setNotes]      = useState('')
  const [reason,     setReason]     = useState('')
  const [assignTo,   setAssignTo]   = useState(item.assigned_to || '')
  const [resolvedBy, setResolvedBy] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [feedback,   setFeedback]   = useState(null)

  const cfg     = getWorkflowConfig(item.status, item.days_pending || 0)
  const missing = isMissing(item.status)
  const matched = isMatched(item.status)
  const orphan  = isOrphan(item.status)
  const review  = isReview(item.status)
  const refund  = isRefund(item.amount)
  const waived  = isWaived(item.status)

  const fileRef   = useRef()
  const cameraRef = useRef()

  function toggleAction(key) {
    setOpenAction(prev => prev === key ? null : key)
    setFeedback(null)
  }

  // Smart endpoint — uses match_id if exists, txn_id if not
  function resolveEndpoint(resolution_action, extra = {}) {
    if (item.match_id) {
      return postAction(`/matches/${item.match_id}/resolve`, {
        resolution_action, ...extra
      })
    }
    return postAction(`/transactions/${item.txn_id}/resolve-missing`, {
      resolution_action, ...extra
    })
  }

  function escalateEndpoint() {
    if (item.match_id) {
      return postAction(`/matches/${item.match_id}/escalate`, { notes })
    }
    return postAction(`/transactions/${item.txn_id}/resolve-missing`, {
      resolution_action: 'escalated', notes
    })
  }

  async function postAction(endpoint, body) {
    setLoading(true)
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setFeedback({ type: 'success', msg: 'Action completed successfully' })
        await onRefresh()
        setTimeout(onClose, 1200)
      } else {
        const err = await res.json().catch(() => ({}))
        setFeedback({ type: 'error', msg: err.detail || 'Something went wrong. Try again.' })
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Could not connect to API.' })
    }
    setLoading(false)
  }

  async function handleUpload(file) {
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`${API}/upload-receipt`, { method: 'POST', body: form })
      if (res.ok) {
        setFeedback({ type: 'success', msg: 'Receipt uploaded and matched!' })
        await onRefresh()
        setTimeout(onClose, 1200)
      } else {
        setFeedback({ type: 'error', msg: 'Upload failed. Try again.' })
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Could not connect to API.' })
    }
    setLoading(false)
  }

  return (
    <div style={{ width: 360, background: 'white', borderLeft: '0.5px solid #e8e6e1', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e8e6e1', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>{getCategoryIcon(item.category)}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: waived ? '#9ca3af' : '#111827' }}>
                {item.vendor || item.receipt?.vendor || 'Unknown'}
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 500, color: refund ? '#059669' : waived ? '#9ca3af' : '#111827' }}>
              {refund ? '-' : ''}${Math.abs(item.amount || 0).toFixed(2)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 16, color: '#9ca3af', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 500, background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
          {item.scenario_type && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#f3f4f6', color: '#374151', fontWeight: 500 }}>
              {item.scenario_type.replace(/_/g, ' ')}
            </span>
          )}
          {(item.days_pending || 0) > 0 && !waived && (
            <span style={{ fontSize: 10, fontWeight: 500, color: (item.days_pending || 0) >= 15 ? '#dc2626' : (item.days_pending || 0) >= 8 ? '#ea580c' : '#9ca3af' }}>
              {item.days_pending}d pending
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {feedback && (
          <div style={{ padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: feedback.type === 'success' ? '#d1fae5' : '#fee2e2', color: feedback.type === 'success' ? '#065f46' : '#991b1b' }}>
            {feedback.type === 'success' ? '✅ ' : '❌ '}{feedback.msg}
          </div>
        )}

        <ContextBanner item={item} />

        {/* Transaction details */}
        <SCard>
          <STitle>Transaction</STitle>
          <SRow label="Merchant" value={item.vendor} />
          <SRow label="Amount"   value={`${refund ? '-' : ''}$${Math.abs(item.amount || 0).toFixed(2)}`} valueColor={refund ? '#059669' : undefined} />
          <SRow label="Date"     value={item.transaction_date?.slice(0, 10)} />
          <SRow label="Category" value={item.category} />
        </SCard>

        {/* Receipt details */}
        {item.receipt?.vendor && (
          <SCard variant={item.status === 'awaiting_clarification' ? 'warn' : 'default'}>
            <STitle color={item.status === 'awaiting_clarification' ? '#d97706' : undefined}>Receipt on file</STitle>
            <SRow label="Vendor" value={item.receipt.vendor} />
            <SRow label="Amount" value={`$${item.receipt.amount?.toFixed(2)}`} valueColor={item.status === 'awaiting_clarification' ? '#d97706' : undefined} />
            <SRow label="Date"   value={item.receipt.date?.slice(0, 10)} />
            {item.status === 'awaiting_clarification' && item.amount && item.receipt.amount && (
              <SRow label="Difference" value={`+$${(item.amount - item.receipt.amount).toFixed(2)}`} valueColor="#d97706" />
            )}
          </SCard>
        )}

        {/* ── WAIVED — read only audit view ── */}
        {waived && (
          <SCard variant="audit">
            <STitle>Manually closed — audit record</STitle>
            <SRow label="Resolution"  value={item.resolution_action?.replace(/_/g, ' ')} />
            <SRow label="Resolved by" value={item.workflow?.assigned_by || item.assigned_to || 'Unknown'} />
            <SRow label="Resolved at" value={item.workflow?.assigned_at ? timeAgo(item.workflow.assigned_at) : '—'} />
            {item.reviewer_notes && (
              <div style={{ marginTop: 8, padding: '8px 10px', background: 'white', borderRadius: 7, border: '0.5px solid #e8e6e1' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{item.reviewer_notes}</div>
              </div>
            )}
            <div style={{ marginTop: 8, padding: '7px 10px', background: '#fef3c7', borderRadius: 6, border: '0.5px solid #fde68a', fontSize: 10, color: '#92400e' }}>
              ⚠️ This record is read-only. Contact an admin to reopen.
            </div>
          </SCard>
        )}

        {/* ── ACTIONS — only for non-waived, non-matched ── */}
        {!matched && !waived && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
              What would you like to do?
            </div>

            {/* MISSING RECEIPT ACTIONS */}
            {missing && (
              <>
                <input ref={fileRef}   type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])} />

                <ActionOption icon="📄" iconBg="#dbeafe" label="Upload receipt" sub="JPG, PNG or PDF — GPT reads automatically" expanded={openAction === 'upload'} onClick={() => toggleAction('upload')}>
                  <button onClick={() => fileRef.current.click()} style={{ width: '100%', border: '1.5px dashed #d1d5db', borderRadius: 8, padding: '14px', background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151', marginBottom: 6 }}>
                    📁 Choose file or drag and drop
                  </button>
                  <button onClick={() => cameraRef.current.click()} style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 7, padding: '8px', background: 'white', cursor: 'pointer', fontSize: 11, color: '#374151' }}>
                    📸 Take photo with camera
                  </button>
                  {loading && <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', marginTop: 8 }}>🤖 GPT is reading your receipt...</div>}
                </ActionOption>

                <ActionOption icon="✏️" iconBg="#f0fdf4" label="Enter manually" sub="Type vendor, amount and date" expanded={openAction === 'manual'} onClick={() => toggleAction('manual')}>
                  <input placeholder="Vendor name" style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', marginBottom: 6, fontFamily: 'inherit' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                    <input placeholder="Amount ($)" type="number" style={{ border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
                    <input type="date" style={{ border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <ResolveBtn label="Save & match" onClick={() => {}} disabled={loading} />
                </ActionOption>

                <ActionOption icon="📝" iconBg="#fef3c7" label="Resolve with notes" sub="No receipt available — explain and close" expanded={openAction === 'resolve'} onClick={() => toggleAction('resolve')}>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 5 }}>Your name <span style={{ color: '#e24b4a' }}>*required</span></div>
                  <input value={resolvedBy} onChange={e => setResolvedBy(e.target.value)} placeholder="Enter your name for audit trail" style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', marginBottom: 8, fontFamily: 'inherit' }} />
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 5 }}>Reason for no receipt</div>
                  <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', background: 'white', marginBottom: 8, fontFamily: 'inherit' }}>
                    <option value="">Select a reason...</option>
                    <option value="lost">Receipt lost or unavailable</option>
                    <option value="personal">Personal expense — no receipt needed</option>
                    <option value="cash">Cash reimbursed directly</option>
                    <option value="digital">Digital purchase — no physical receipt</option>
                    <option value="other">Other</option>
                  </select>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 5 }}>Notes <span style={{ color: '#e24b4a' }}>*required</span></div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Explain what this charge was for..." style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'white' }} />
                  <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right', marginTop: 2, marginBottom: 6 }}>{notes.length} / 500</div>
                  <div style={{ background: '#fffbeb', border: '0.5px solid #fde68a', borderRadius: 6, padding: '7px 10px', fontSize: 10, color: '#92400e', marginBottom: 6 }}>
                    ⚠️ This will be logged in the audit trail with your name and timestamp. This action cannot be undone.
                  </div>
                  <ResolveBtn
                    label="Mark as resolved"
                    disabled={loading || !notes.trim() || !reason || !resolvedBy.trim()}
                    onClick={() => resolveEndpoint('waived_exception', { notes: `[${resolvedBy}] ${notes}`, reason })}
                  />
                </ActionOption>
              </>
            )}

            {/* REVIEW / CLARIFICATION ACTIONS */}
            {review && (
              <>
                <ActionOption icon="✅" iconBg="#d1fae5" label="Confirm match" sub="Approve this reconciliation as correct" expanded={openAction === 'confirm'} onClick={() => toggleAction('confirm')}>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 5 }}>Note (optional)</div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Tip confirmed by employee..." style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'white' }} />
                  <ResolveBtn label="Confirm & resolve" color="#059669" disabled={loading} onClick={() => resolveEndpoint('match_confirmed', { notes })} />
                </ActionOption>

                <ActionOption icon="📄" iconBg="#dbeafe" label="Upload correct receipt" sub="Replace with the right receipt" expanded={openAction === 'reupload'} onClick={() => toggleAction('reupload')}>
                  <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0])} />
                  <button onClick={() => fileRef.current.click()} style={{ width: '100%', border: '1.5px dashed #d1d5db', borderRadius: 8, padding: '14px', background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                    📁 Choose replacement receipt
                  </button>
                </ActionOption>

                <ActionOption icon="👤" iconBg="#ede9fe" label="Assign reviewer" sub="Send to a team member" expanded={openAction === 'assign'} onClick={() => toggleAction('assign')}>
                  <input value={assignTo} onChange={e => setAssignTo(e.target.value)} placeholder="Name or email" style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', marginBottom: 6, fontFamily: 'inherit' }} />
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Instructions for reviewer..." style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'white' }} />
                  <ResolveBtn label="Assign" disabled={loading || !assignTo.trim()} onClick={() => postAction(`/matches/${item.match_id}/assign`, { assigned_to: assignTo, assigned_by: assignTo, notes })} />
                </ActionOption>
              </>
            )}

            {/* ORPHAN ACTIONS */}
            {orphan && (
              <>
                <ActionOption icon="📭" iconBg="#f0fdf4" label="Close orphan" sub="No transaction exists — write this off" expanded={openAction === 'close_orphan'} onClick={() => toggleAction('close_orphan')}>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Explain why this receipt has no matching transaction..." style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'white' }} />
                  <div style={{ background: '#fffbeb', border: '0.5px solid #fde68a', borderRadius: 6, padding: '7px 10px', fontSize: 10, color: '#92400e', margin: '6px 0' }}>
                    ⚠️ This action is logged in the audit trail.
                  </div>
                  <ResolveBtn label="Close orphan" disabled={loading || !notes.trim()} onClick={() => resolveEndpoint('close_orphan', { notes })} />
                </ActionOption>

                <ActionOption icon="⏳" iconBg="#dbeafe" label="Wait for transaction sync" sub="Transaction may still be pending" expanded={openAction === 'wait'} onClick={() => toggleAction('wait')}>
                  <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5, marginBottom: 8 }}>
                    This will keep the receipt in the queue and check again when new transactions are imported.
                  </div>
                  <ResolveBtn label="Mark as waiting" disabled={loading} color="#3b82f6" onClick={() => resolveEndpoint('pending_sync', { notes: 'Waiting for transaction to post' })} />
                </ActionOption>
              </>
            )}

            {/* REFUND ACTIONS */}
            {refund && (
              <>
                <ActionOption icon="🔗" iconBg="#d1fae5" label="Link to original transaction" sub="Match this refund to the original charge" expanded={openAction === 'link'} onClick={() => toggleAction('link')}>
                  <input placeholder="Search original transaction..." style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', fontFamily: 'inherit', marginBottom: 6 }} />
                  <ResolveBtn label="Link refund" disabled={loading} color="#059669" onClick={() => {}} />
                </ActionOption>

                <ActionOption icon="📝" iconBg="#fef3c7" label="Mark as standalone credit" sub="Refund with no original charge" expanded={openAction === 'standalone'} onClick={() => toggleAction('standalone')}>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Insurance refund for overpayment..." style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'white' }} />
                  <ResolveBtn label="Mark & close" disabled={loading || !notes.trim()} onClick={() => resolveEndpoint('match_confirmed', { notes })} />
                </ActionOption>
              </>
            )}

            {/* ESCALATE — always available */}
            <ActionOption icon="⬆️" iconBg="#fce7f3" label="Escalate to manager" sub="Send for approval or investigation" expanded={openAction === 'escalate'} onClick={() => toggleAction('escalate')}>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Describe why you are escalating..." style={{ width: '100%', border: '0.5px solid #e8e6e1', borderRadius: 6, padding: '7px 9px', fontSize: 11, outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'white' }} />
              <ResolveBtn label="Escalate" disabled={loading || !notes.trim()} color="#d97706" onClick={() => escalateEndpoint()} />
            </ActionOption>
          </div>
        )}

        {/* Matched — read only */}
        {matched && (
          <SCard variant="success">
            <div style={{ fontSize: 12, color: '#065f46', textAlign: 'center', padding: '8px 0' }}>
              ✅ This transaction has been reconciled. No action needed.
            </div>
          </SCard>
        )}

        {/* Audit trail — shown for all non-waived items that have activity */}
        {!waived && (item.assigned_to || item.reviewer_notes || item.resolution_action) && (
          <SCard>
            <STitle>Audit trail</STitle>
            {item.assigned_to       && <SRow label="Assigned to"  value={item.assigned_to} />}
            {item.assigned_at       && <SRow label="Assigned"     value={timeAgo(item.assigned_at)} />}
            {item.resolution_action && <SRow label="Resolution"   value={item.resolution_action.replace(/_/g, ' ')} />}
            {item.reviewer_notes && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{item.reviewer_notes}"
              </div>
            )}
          </SCard>
        )}
      </div>

      {/* Footer */}
      {!waived && (
        <div style={{ padding: '10px 16px', borderTop: '0.5px solid #e8e6e1', display: 'flex', gap: 6, flexShrink: 0, boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' }}>
          <button onClick={() => toggleAction('escalate')} style={{ flex: 1, background: '#fef3c7', color: '#92400e', border: '0.5px solid #fde68a', borderRadius: 7, padding: '7px', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
            ⬆️ Escalate
          </button>
          <button onClick={onClose} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 7, padding: '7px', fontSize: 11, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      )}
      {waived && (
        <div style={{ padding: '10px 16px', borderTop: '0.5px solid #e8e6e1', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 7, padding: '8px', fontSize: 11, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      )}
    </div>
  )
}
