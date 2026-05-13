// ─── CENTRALIZED WORKFLOW CONFIG ─────────────────────────────
// All status/badge/color/action logic lives here.
// Frontend just reads this — never decides operational rules itself.

export const CATEGORY_ICONS = {
  food:          '🍴',
  groceries:     '🛒',
  transport:     '🚗',
  insurance:     '🛡️',
  subscriptions: '💻',
  utilities:     '⚡',
  shopping:      '🛍️',
  other:         '💳',
}

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category?.toLowerCase()] || '💳'
}

export const WORKFLOW_CONFIG = {
  matched_auto: {
    label: 'Matched', bg: '#d1fae5', color: '#065f46', dot: '#059669',
    severity: 'none', actions: [],
  },
  matched_with_confirmation: {
    label: 'Matched', bg: '#d1fae5', color: '#065f46', dot: '#059669',
    severity: 'none', actions: [],
  },
  duplicate_receipt: {
    label: 'Duplicate', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6',
    severity: 'medium', actions: ['confirm', 'mark_duplicate', 'escalate'],
  },
  orphan_receipt: {
    label: 'Orphan', bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6',
    severity: 'medium', actions: ['close_orphan', 'wait', 'escalate'],
  },
  pending_transaction_sync: {
    label: 'Orphan', bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6',
    severity: 'medium', actions: ['close_orphan', 'wait', 'escalate'],
  },
  awaiting_clarification: {
    label: 'Needs review', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b',
    severity: 'high', actions: ['confirm', 'reupload', 'assign', 'escalate'],
  },
  needs_manual_review: {
    label: 'Needs review', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b',
    severity: 'high', actions: ['confirm', 'reupload', 'assign', 'escalate'],
  },
  escalated: {
    label: 'Escalated', bg: '#fce7f3', color: '#9d174d', dot: '#ec4899',
    severity: 'critical', actions: ['confirm', 'reupload', 'escalate'],
  },
  pending_receipt: {
    label: 'Missing', bg: '#fee2e2', color: '#991b1b', dot: '#e24b4a',
    severity: 'high', actions: ['upload', 'manual', 'resolve_notes', 'escalate'],
  },
  overdue_receipt: {
    label: 'Overdue', bg: '#fecaca', color: '#991b1b', dot: '#dc2626',
    severity: 'critical', actions: ['upload', 'manual', 'resolve_notes', 'escalate'],
  },
  critical_missing_receipt: {
    label: 'Overdue', bg: '#fecaca', color: '#991b1b', dot: '#dc2626',
    severity: 'critical', actions: ['upload', 'manual', 'resolve_notes', 'escalate'],
  },
  // ── Waived / manually closed ──────────────────────────────
  waived_exception: {
    label: 'Waived', bg: '#f3f4f6', color: '#374151', dot: '#9ca3af',
    severity: 'none', actions: [],
  },
  closed: {
    label: 'Closed', bg: '#f3f4f6', color: '#374151', dot: '#9ca3af',
    severity: 'none', actions: [],
  },
}

// Valid workflow state transitions
export const ALLOWED_TRANSITIONS = {
  open:        ['in_progress', 'escalated'],
  in_progress: ['resolved', 'escalated'],
  resolved:    ['closed'],
  escalated:   ['in_progress', 'resolved'],
  closed:      [],
}

export function getWorkflowConfig(status, days = 0) {
  if (WORKFLOW_CONFIG[status]) return WORKFLOW_CONFIG[status]
  // Dynamic urgency for missing receipts
  if (days >= 15) return WORKFLOW_CONFIG.overdue_receipt
  if (days >= 8)  return { ...WORKFLOW_CONFIG.pending_receipt, label: 'Urgent', bg: '#fed7aa', color: '#9a3412', dot: '#ea580c' }
  return WORKFLOW_CONFIG.pending_receipt
}

export function isMissing(status) {
  return !status || ['pending_receipt', 'overdue_receipt', 'critical_missing_receipt'].includes(status)
}

export function isMatched(status) {
  return ['matched_auto', 'matched_with_confirmation'].includes(status)
}

export function isOrphan(status) {
  return ['orphan_receipt', 'pending_transaction_sync'].includes(status)
}

export function isReview(status) {
  return ['needs_manual_review', 'awaiting_clarification', 'escalated'].includes(status)
}

export function isWaived(status) {
  return ['waived_exception', 'closed'].includes(status)
}

export function isRefund(amount) {
  return amount < 0
}

export function getUrgency(days) {
  if (days >= 15) return 'critical'
  if (days >= 8)  return 'high'
  if (days >= 1)  return 'medium'
  return 'low'
}

export function getContextMessage(item) {
  const { status, days_pending: days = 0, amount, receipt, vendor } = item
  const name   = vendor || receipt?.vendor || 'This vendor'
  const txnAmt = amount
  const rcpAmt = receipt?.amount

  if (isMatched(status))
    return { type: 'success', msg: 'Receipt matched automatically. No action needed.' }

  if (isWaived(status))
    return { type: 'info', msg: 'This transaction was manually closed with notes. Check the audit trail below for details.' }

  if (status === 'duplicate_receipt')
    return { type: 'info', msg: 'A receipt with the same vendor, amount and date already exists. Review which one is correct.' }

  if (isOrphan(status))
    return { type: 'warn', msg: `A receipt was uploaded for ${name} but no matching bank transaction was found. The transaction may still be pending.` }

  if (status === 'awaiting_clarification') {
    const diff = txnAmt && rcpAmt ? (txnAmt - rcpAmt).toFixed(2) : null
    if (diff && diff > 0)
      return { type: 'warn', msg: `The transaction ($${Number(txnAmt).toFixed(2)}) is $${diff} more than the receipt ($${Number(rcpAmt).toFixed(2)}). This commonly happens when a tip is added after signing. Check your receipt copy for the tip amount.` }
    return { type: 'warn', msg: 'This transaction needs clarification before it can be reconciled.' }
  }

  if (isReview(status))
    return { type: 'warn', msg: 'This transaction could not be automatically reconciled and needs manual review.' }

  if (isRefund(txnAmt))
    return { type: 'info', msg: `This is a credit of $${Math.abs(txnAmt).toFixed(2)}. Verify it is linked to the correct original transaction.` }

  if (days >= 15)
    return { type: 'critical', msg: `No receipt has been uploaded for this transaction in ${days} days. This is overdue and may affect your monthly reconciliation.` }
  if (days >= 8)
    return { type: 'warn', msg: `No receipt has been uploaded for this ${name} transaction yet. It has been pending for ${days} days.` }

  return { type: 'info', msg: 'No receipt found for this transaction. Upload one to complete reconciliation.' }
}

export function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}