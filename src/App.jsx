import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Upload from "./pages/Upload";
import Alerts from "./pages/Alerts";  // kept but hidden
import AskAI from "./pages/AskAI";

export default function App() {
  const [page, setPage] = useState("dashboard");

  // Alerts kept here as fallback — not in nav
  const renderPage = () => {
    switch (page) {
      case "dashboard":    return <Dashboard setPage={setPage} />;
      case "transactions": return <Transactions />;
      case "upload":       return <Upload />;
      case "alerts":       return <Alerts />;  // fallback only
      case "ai":           return <AskAI />;
      default:             return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* SIDEBAR */}
      <div style={{
        width: 220,
        background: "#0f172a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
      }}>
        <div style={{ padding: "20px 20px 12px", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, background: "#e24b4a", borderRadius: 5 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "white" }}>RestoTrack</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: "8px 0" }}>
          {[
            { key: "dashboard",    label: "Dashboard",    icon: "⊞" },
            { key: "transactions", label: "Transactions", icon: "💳" },
            { key: "upload",       label: "Upload",       icon: "📤" },
            { key: "ai",           label: "Ask AI",       icon: "🤖" },
          ].map(item => (
            <div
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 16px", fontSize: 12, cursor: "pointer",
                color: page === item.key ? "white" : "rgba(255,255,255,0.5)",
                borderLeft: page === item.key ? "2px solid #e24b4a" : "2px solid transparent",
                background: page === item.key ? "rgba(226,75,74,0.1)" : "transparent",
              }}
            >
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 16px", borderTop: "0.5px solid rgba(255,255,255,0.07)", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
          v2.1 · RestoTrack
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, background: "#f3f4f6", overflow: "hidden" }}>
        {renderPage()}
      </div>

    </div>
  );
}