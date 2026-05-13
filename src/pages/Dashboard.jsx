import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip
} from "recharts";

const API = "http://127.0.0.1:8000";
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#e24b4a", "#06b6d4", "#a855f7", "#84cc16", "#ec4899"];

// ── Use category from DB — no hardcoded keyword lists ──────
function getCategoryData(transactions) {
  const map = {}
  transactions.filter(t => t.amount > 0).forEach(t => {
    const cat = t.category || "other"
    map[cat] = (map[cat] || 0) + (t.amount || 0)
  })
  const total = Object.values(map).reduce((s, v) => s + v, 0)
  return Object.entries(map)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      percent: total > 0 ? ((value / total) * 100).toFixed(0) : 0
    }))
    .sort((a, b) => b.value - a.value)
}

function getTrendData(transactions) {
  const map = {}
  transactions.forEach(t => {
    if (!t.transaction_date) return
    const date = t.transaction_date.split("T")[0]
    map[date] = (map[date] || 0) + (t.amount || 0)
  })
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({
      date: date.slice(5),
      amount: parseFloat(amount.toFixed(2))
    }))
}

function getAvg(transactions) {
  const charges = transactions.filter(t => t.amount > 0)
  if (!charges.length) return "0.00"
  const total = charges.reduce((s, t) => s + (t.amount || 0), 0)
  return (total / charges.length).toFixed(2)
}

const STATUS_STYLE = {
  matched_auto:              { label: "Matched",   bg: "#d1fae5", color: "#065f46" },
  matched_with_confirmation: { label: "Matched",   bg: "#d1fae5", color: "#065f46" },
  awaiting_clarification:    { label: "Review",    bg: "#fef3c7", color: "#92400e" },
  needs_manual_review:       { label: "Review",    bg: "#fef3c7", color: "#92400e" },
  escalated:                 { label: "Escalated", bg: "#fce7f3", color: "#9d174d" },
  pending_receipt:           { label: "Missing",   bg: "#fee2e2", color: "#991b1b" },
  overdue_receipt:           { label: "Overdue",   bg: "#fecaca", color: "#991b1b" },
  waived_exception:          { label: "Waived",    bg: "#f3f4f6", color: "#374151" },
  orphan_receipt:            { label: "Orphan",    bg: "#ede9fe", color: "#5b21b6" },
  pending_transaction_sync:  { label: "Orphan",    bg: "#ede9fe", color: "#5b21b6" },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { label: "Pending", bg: "#fef3c7", color: "#92400e" }
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 500, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function KPICard({ icon, label, value, delta, deltaUp, bg }) {
  return (
    <div style={{ background: "white", borderRadius: 8, padding: "12px 14px", border: "0.5px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: "#111827", lineHeight: 1 }}>{value}</div>
        {delta && (
          <div style={{ fontSize: 10, marginTop: 2, color: deltaUp ? "#059669" : "#e24b4a" }}>
            {deltaUp ? "↑" : "↓"} {delta}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ setPage }) {
  const [transactions, setTransactions] = useState([])
  const [insights,     setInsights]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [syncing,      setSyncing]      = useState(false)
  const [trendRange,   setTrendRange]   = useState("all")

  useEffect(() => {
    Promise.all([
      fetch(`${API}/transactions`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API}/insights`).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([txnRes, insRes]) => {
      setTransactions(txnRes.data || [])
      setInsights(insRes.data || [])
      setLoading(false)
    })
  }, [])

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch(`${API}/run-matching`, { method: "POST" })
      const [txnRes, insRes] = await Promise.all([
        fetch(`${API}/transactions`).then(r => r.json()),
        fetch(`${API}/insights`).then(r => r.json()),
      ])
      setTransactions(txnRes.data || [])
      setInsights(insRes.data || [])
    } catch {}
    setSyncing(false)
  }

  // ── Correct match rate calculation ────────────────────────
  // matched = transactions with matched status
  // charges = all non-refund transactions (excludes credits)
  // excludes orphans (receipts with no transaction)
  const matched   = insights.filter(d =>
    d.status === 'matched_auto' || d.status === 'matched_with_confirmation'
  ).length

  const charges   = insights.filter(d =>
    d.type === 'missing_receipt' || d.status === 'matched_auto' || d.status === 'matched_with_confirmation' || d.status === 'awaiting_clarification' || d.status === 'needs_manual_review' || d.status === 'waived_exception'
  ).filter(d => (d.amount || 0) >= 0).length

  const matchRate = charges > 0 ? Math.round((matched / charges) * 100) : 0

  const needsReview = insights.filter(d =>
    d.status === 'needs_manual_review' ||
    d.status === 'awaiting_clarification' ||
    d.status === 'escalated'
  ).length

  const totalSpend   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const categoryData = getCategoryData(transactions)
  const allTrendData = getTrendData(transactions)

  const trendData = trendRange === "7d"
    ? allTrendData.slice(-7)
    : trendRange === "30d"
    ? allTrendData.slice(-30)
    : allTrendData

  // Build insight lookup by transaction id for recent table
  const insightByTxnId = {}
  insights.forEach(i => {
    if (i.transaction?.id) insightByTxnId[i.transaction.id] = i
  })

  const now      = new Date()
  const hour     = now.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#6b7280", fontSize: 14 }}>
      Loading your data...
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "white", borderBottom: "0.5px solid #e5e7eb", flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#111827" }}>
            {greeting}, Pradeep 👋
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · Financial summary
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSync} disabled={syncing} style={{
            background: syncing ? "#6b7280" : "#111827", color: "white",
            border: "none", borderRadius: 6, padding: "7px 14px",
            fontSize: 11, fontWeight: 500, cursor: "pointer"
          }}>
            {syncing ? "Syncing..." : "↻ Sync & Match"}
          </button>
          <button onClick={() => setPage("upload")} style={{
            background: "#e24b4a", color: "white", border: "none",
            borderRadius: 6, padding: "7px 14px", fontSize: 11, fontWeight: 500, cursor: "pointer"
          }}>
            + Upload Receipt
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex: 1, padding: "14px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* KPI ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <KPICard
            icon="💰" label="Total spend" bg="#fef3c7"
            value={`$${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            delta="this period" deltaUp={true}
          />
          <KPICard
            icon="💳" label="Transactions" bg="#dbeafe"
            value={transactions.length}
            delta={`avg $${getAvg(transactions)}`} deltaUp={true}
          />
          <KPICard
            icon="✅" label="Match rate" bg="#d1fae5"
            value={`${matchRate}%`}
            delta={`${matched} of ${charges} matched`} deltaUp={matchRate > 50}
          />
          <KPICard
            icon="⚠️" label="Needs review" bg="#fee2e2"
            value={needsReview}
            delta={needsReview > 0 ? "action required" : "all clear"}
            deltaUp={needsReview === 0}
          />
        </div>

        {/* CHARTS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 10 }}>

          {/* DONUT */}
          <div style={{ background: "white", borderRadius: 8, padding: "14px 16px", border: "0.5px solid #e5e7eb" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#111827", marginBottom: 12 }}>Category breakdown</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ResponsiveContainer width={190} height={190}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" innerRadius={58} outerRadius={90} paddingAngle={2}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                {categoryData.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "#374151" }}>{c.name}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>${c.value.toFixed(0)}</div>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>{c.percent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TREND */}
          <div style={{ background: "white", borderRadius: 8, padding: "14px 16px", border: "0.5px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>Spending trend</span>
              <div style={{ display: "flex", gap: 4 }}>
                {["7d", "30d", "all"].map(r => (
                  <button key={r} onClick={() => setTrendRange(r)} style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "none", cursor: "pointer",
                    background: trendRange === r ? "#111827" : "#f3f4f6",
                    color: trendRange === r ? "white" : "#6b7280"
                  }}>
                    {r === "all" ? "All" : r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={165}>
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, "Spend"]} />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT TRANSACTIONS TABLE */}
        <div style={{ background: "white", borderRadius: 8, padding: "14px 16px", border: "0.5px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>Recent transactions</span>
            <button onClick={() => setPage("transactions")} style={{ fontSize: 10, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>
              View all →
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Description", "Category", "Amount", "Status", "Date"].map(h => (
                  <th key={h} style={{ fontSize: 10, color: "#6b7280", fontWeight: 500, textAlign: "left", padding: "0 0 8px", borderBottom: "0.5px solid #e5e7eb", textTransform: "uppercase", letterSpacing: ".04em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map((t, i) => {
                const insight = insightByTxnId[t.id]
                const refund  = t.amount < 0
                return (
                  <tr key={i}>
                    <td style={{ fontSize: 12, color: "#111827", padding: "8px 0", borderBottom: "0.5px solid #f3f4f6" }}>{t.merchant}</td>
                    <td style={{ fontSize: 11, color: "#6b7280", padding: "8px 0", borderBottom: "0.5px solid #f3f4f6" }}>{t.category || "other"}</td>
                    <td style={{ fontSize: 12, fontWeight: 500, color: refund ? "#059669" : "#111827", padding: "8px 0", borderBottom: "0.5px solid #f3f4f6" }}>
                      {refund ? "-" : ""}${Math.abs(t.amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: "8px 0", borderBottom: "0.5px solid #f3f4f6" }}>
                      <StatusBadge status={insight?.status || (refund ? "matched_auto" : "pending_receipt")} />
                    </td>
                    <td style={{ fontSize: 11, color: "#6b7280", padding: "8px 0", borderBottom: "0.5px solid #f3f4f6" }}>
                      {t.transaction_date?.slice(5, 10)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
