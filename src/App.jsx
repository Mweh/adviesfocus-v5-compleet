import { useState } from "react";

// Pages
import AdviesfocusApp from "./pages/AdviesfocusApp";
import AdviesfocusDemo from "./pages/AdviesfocusDemo";
import KlantPagina from "./pages/KlantPagina";
import ModuleBProductvergelijking from "./pages/ModuleBProductvergelijking";
import ModuleCBeleggingsbeleid from "./pages/ModuleCBeleggingsbeleid";
import ModuleDV2 from "./pages/ModuleDV2";
import Analyse21Transitie from "./pages/Analyse21Transitie";
import AnalyseVolledig from "./pages/AnalyseVolledig";
import BeheerNazorg from "./pages/BeheerNazorg";
import Beheeromgeving from "./pages/Beheeromgeving";
import Documentuitwisseling from "./pages/Documentuitwisseling";
import Werknemersdossier from "./pages/Werknemersdossier";
import NieuweModules from "./pages/NieuweModules";
import UrmAdminUpload from "./pages/UrmAdminUpload";

const MODULES = [
  { id: "dashboard", label: "Dashboard App", icon: "🏠", desc: "Hoofddashboard — klantbeheer" },
  { id: "demo", label: "Demo", icon: "🎯", desc: "Demo met berekeningen & grafieken" },
  { id: "klant", label: "Klantpagina", icon: "👤", desc: "Klantdetail — Oranje Techniek" },
  { id: "module-b", label: "Module B", icon: "📊", desc: "Productvergelijking aanbieders" },
  { id: "module-c", label: "Module C", icon: "📈", desc: "Beleggingsbeleid & lifecycle" },
  { id: "module-d", label: "Module D", icon: "🏗️", desc: "BPF-analyse & pensioenfondsen" },
  { id: "analyse-21", label: "Analyse 21", icon: "📋", desc: "21-punten transitie-analyse" },
  { id: "analyse-volledig", label: "Analyse Volledig", icon: "📑", desc: "Volledige pensioenanalyse" },
  { id: "beheer-nazorg", label: "Beheer Nazorg", icon: "🔄", desc: "Nazorg & mutatiebeheer" },
  { id: "beheeromgeving", label: "Beheeromgeving", icon: "⚙️", desc: "Kantoor- & gebruikersbeheer" },
  { id: "documenten", label: "Documenten", icon: "📁", desc: "Veilige documentuitwisseling" },
  { id: "werknemer", label: "Werknemersdossier", icon: "👷", desc: "Individueel werknemersdossier" },
  { id: "nieuwe-modules", label: "Nieuwe Modules", icon: "✨", desc: "Nieuwe functionaliteiten" },
  { id: "urm-admin", label: "URM Admin", icon: "📤", desc: "DNB URM scenarioset upload" },
];

const PAGE_MAP = {
  dashboard: AdviesfocusApp,
  demo: AdviesfocusDemo,
  klant: KlantPagina,
  "module-b": ModuleBProductvergelijking,
  "module-c": ModuleCBeleggingsbeleid,
  "module-d": ModuleDV2,
  "analyse-21": Analyse21Transitie,
  "analyse-volledig": AnalyseVolledig,
  "beheer-nazorg": BeheerNazorg,
  beheeromgeving: Beheeromgeving,
  documenten: Documentuitwisseling,
  werknemer: Werknemersdossier,
  "nieuwe-modules": NieuweModules,
  "urm-admin": UrmAdminUpload,
};

const font = "'DM Sans', system-ui, sans-serif";

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const Page = PAGE_MAP[active];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: font }}>
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 56 : 260,
          minWidth: collapsed ? 56 : 260,
          background: "#ffffff",
          borderRight: "0.5px solid rgba(15,15,14,0.10)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s, min-width 0.2s",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "16px 14px",
            borderBottom: "0.5px solid rgba(15,15,14,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            minHeight: 52,
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          <svg width={24} height={24} viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="22" height="22" rx="4" fill="#0f0f0e" />
            <rect x="14" y="14" width="22" height="22" rx="4" fill="none" stroke="#0f0f0e" strokeWidth="1.5" />
            <rect x="16" y="16" width="8" height="8" rx="1.5" fill="#ffffff" />
          </svg>
          {!collapsed && (
            <span style={{ fontSize: 14, letterSpacing: "-.01em" }}>
              <span style={{ fontWeight: 300, color: "#0f0f0e" }}>Advies</span>
              <span style={{ fontWeight: 600, color: "#0f0f0e" }}>Focus</span>
              <span style={{ fontSize: 10, color: "rgba(15,15,14,0.38)", marginLeft: 6 }}>v5</span>
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              title={m.desc}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: collapsed ? "10px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                border: "none",
                borderRadius: 8,
                background: active === m.id ? "#e0f2ee" : "transparent",
                color: active === m.id ? "#0f6e56" : "rgba(15,15,14,0.65)",
                fontSize: 13,
                fontWeight: active === m.id ? 600 : 400,
                fontFamily: font,
                cursor: "pointer",
                marginBottom: 1,
                textAlign: "left",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (active !== m.id) e.currentTarget.style.background = "#f1efe8";
              }}
              onMouseLeave={(e) => {
                if (active !== m.id) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: "center" }}>{m.icon}</span>
              {!collapsed && (
                <div>
                  <div>{m.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: "rgba(15,15,14,0.38)", marginTop: 1 }}>{m.desc}</div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: collapsed ? "12px 0" : "12px 14px",
            borderTop: "0.5px solid rgba(15,15,14,0.06)",
            fontSize: 10,
            color: "rgba(15,15,14,0.3)",
            textAlign: collapsed ? "center" : "left",
          }}
        >
          {!collapsed && "Demo Kantoor · Pro"}
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          background: "#f7f6f3",
        }}
      >
        {Page ? <Page /> : <div style={{ padding: 40, color: "rgba(15,15,14,0.4)" }}>Module niet gevonden</div>}
      </main>
    </div>
  );
}
