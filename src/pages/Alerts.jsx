import { useState, useEffect } from 'react'
import WorkflowDrawer from "../components/WorkflowDrawer";

const API = 'https://restaurant-accountability-system.onrender.com'

export default function Alerts() {

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  // =========================
  // SELECTED WORKFLOW
  // =========================

  const [selectedWorkflow, setSelectedWorkflow] = useState(null)

  // =========================
  // FETCH INSIGHTS
  // =========================

  useEffect(() => {
    fetch(`${API}/insights`)
      .then(r => r.json())
      .then(d => {
        console.log('INSIGHTS:', d.data)
        setData(d.data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // =========================
  // ALERT GROUPS
  // =========================

  const missingReceipts = data.filter(
    d =>
      d.status === 'pending_receipt' ||
      d.status === 'critical_missing_receipt'
  )

  const orphanReceipts = data.filter(
    d =>
      d.status === 'pending_transaction_sync' ||
      d.status === 'orphan_receipt'
  )

  const reviewRequired = data.filter(
    d =>
      d.status === 'awaiting_clarification' ||
      d.status === 'needs_manual_review'
  )

  const urgent = data.filter(
    d => d.priority === 'high'
  )

  const medium = data.filter(
    d => d.priority === 'medium'
  )

  const allClear =
    missingReceipts.length === 0 &&
    orphanReceipts.length === 0 &&
    reviewRequired.length === 0

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#6b7280',
          fontSize: 14
        }}
      >
        Checking alerts...
      </div>
    )
  }

  // =========================
  // UI
  // =========================

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#f9fafb'
      }}
    >

      {/* ALERTS PANEL */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >

        {/* HEADER */}
        <div
          style={{
            padding: '12px 18px',
            background: 'white',
            borderBottom: '0.5px solid #e5e7eb',
            flexShrink: 0
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: '#111827'
            }}
          >
            Reconciliation Alerts
          </h2>

          <p
            style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: '#6b7280'
            }}
          >
            {urgent.length} urgent · {medium.length} medium · {missingReceipts.length} missing · {orphanReceipts.length} orphan
          </p>
        </div>

        {/* BODY */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >

          {/* EMPTY */}
          {allClear && (
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                border: '0.5px solid #e5e7eb',
                padding: 40,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                ✅
              </div>

              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 4,
                  color: '#111827'
                }}
              >
                All reconciled
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#6b7280'
                }}
              >
                No unresolved financial issues found
              </div>
            </div>
          )}

          {/* MISSING RECEIPTS */}
          {missingReceipts.length > 0 && (
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                border: '0.5px solid #e5e7eb',
                padding: '14px 16px'
              }}
            >

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#991b1b',
                  marginBottom: 12
                }}
              >
                📄 Missing Receipts ({missingReceipts.length})
              </div>

              {missingReceipts.map((a, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedWorkflow(a)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    marginBottom: 8,
                    background: '#fef2f2',
                    border: '0.5px solid #fecaca',
                    borderLeft: '3px solid #dc2626'
                  }}
                >

                  <div style={{ flex: 1 }}>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: 2
                      }}
                    >
                      {a.vendor || 'Unknown Vendor'} · ${Number(a.amount || 0).toFixed(2)}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b7280'
                      }}
                    >
                      Missing for {a.days_pending} days
                    </div>

                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontWeight: 600,
                      background: '#fee2e2',
                      color: '#991b1b'
                    }}
                  >
                    {a.priority}
                  </span>

                </div>
              ))}

            </div>
          )}

          {/* ORPHAN RECEIPTS */}
          {orphanReceipts.length > 0 && (
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                border: '0.5px solid #e5e7eb',
                padding: '14px 16px'
              }}
            >

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9a3412',
                  marginBottom: 12
                }}
              >
                🧾 Orphan Receipts ({orphanReceipts.length})
              </div>

              {orphanReceipts.map((a, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedWorkflow(a)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    marginBottom: 8,
                    background: '#fff7ed',
                    border: '0.5px solid #fdba74',
                    borderLeft: '3px solid #ea580c'
                  }}
                >

                  <div style={{ flex: 1 }}>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: 2
                      }}
                    >
                      {a.receipt?.vendor || 'Unknown Vendor'} · ${Number(a.receipt?.amount || 0).toFixed(2)}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b7280'
                      }}
                    >
                      Receipt uploaded but no matching transaction found
                    </div>

                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontWeight: 600,
                      background: '#fed7aa',
                      color: '#9a3412'
                    }}
                  >
                    Orphan
                  </span>

                </div>
              ))}

            </div>
          )}

          {/* REVIEW REQUIRED */}
          {reviewRequired.length > 0 && (
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                border: '0.5px solid #e5e7eb',
                padding: '14px 16px'
              }}
            >

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#92400e',
                  marginBottom: 12
                }}
              >
                🟡 Review Required ({reviewRequired.length})
              </div>

              {reviewRequired.map((a, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedWorkflow(a)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    marginBottom: 8,
                    background: '#fffbeb',
                    border: '0.5px solid #fde68a',
                    borderLeft: '3px solid #f59e0b'
                  }}
                >

                  <div style={{ flex: 1 }}>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#111827',
                        marginBottom: 2
                      }}
                    >
                      {a.vendor || a.receipt?.vendor || 'Unknown Vendor'}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b7280'
                      }}
                    >
                      Confidence score: {a.score}
                    </div>

                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontWeight: 600,
                      background: '#fef3c7',
                      color: '#92400e'
                    }}
                  >
                    Review
                  </span>

                </div>
              ))}

            </div>
          )}

        </div>
      </div>

      {/* WORKFLOW DRAWER */}
      {selectedWorkflow && (
        <WorkflowDrawer
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
        />
      )}

    </div>
  )
}