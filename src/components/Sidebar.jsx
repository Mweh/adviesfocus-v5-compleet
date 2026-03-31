"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "@/lib/design-tokens";

const MODULES = [
  { href: "/", label: "Dashboard", icon: "🏠", desc: "Hoofddashboard — klantbeheer" },
  { href: "/demo", label: "Demo", icon: "🎯", desc: "Demo met berekeningen & grafieken" },
  { href: "/analyse/21", label: "Analyse 21", icon: "📋", desc: "21-punten transitie-analyse" },
  { href: "/analyse/volledig", label: "Analyse Volledig", icon: "📑", desc: "Volledige pensioenanalyse" },
  { href: "/module-b", label: "Module B", icon: "📊", desc: "Productvergelijking aanbieders" },
  { href: "/module-c", label: "Module C", icon: "📈", desc: "Beleggingsbeleid & lifecycle" },
  { href: "/module-d", label: "Module D", icon: "🏗️", desc: "BPF-analyse & pensioenfondsen" },
  { href: "/beheer", label: "Beheeromgeving", icon: "⚙️", desc: "Kantoor- & gebruikersbeheer" },
  { href: "/beheer/nazorg", label: "Beheer Nazorg", icon: "🔄", desc: "Nazorg & mutatiebeheer" },
  { href: "/documenten", label: "Documenten", icon: "📁", desc: "Veilige documentuitwisseling" },
  { href: "/modules", label: "Nieuwe Modules", icon: "✨", desc: "Nieuwe functionaliteiten" },
  { href: "/admin/urm", label: "URM Admin", icon: "📤", desc: "DNB URM scenarioset upload" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 56 : 260,
        minWidth: collapsed ? 56 : 260,
        background: T.bgCard,
        borderRight: `0.5px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s, min-width 0.2s",
        overflow: "hidden",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "16px 14px",
          borderBottom: `0.5px solid ${T.borderSec}`,
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
            <span style={{ fontWeight: 300, color: T.text }}>Advies</span>
            <span style={{ fontWeight: 600, color: T.text }}>Focus</span>
            <span style={{ fontSize: 10, color: T.textTer, marginLeft: 6 }}>v5</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
        {MODULES.map((m) => {
          const isActive = pathname === m.href || (m.href !== "/" && pathname.startsWith(m.href));
          return (
            <Link
              key={m.href}
              href={m.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: collapsed ? "10px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                border: "none",
                borderRadius: 8,
                background: isActive ? T.accentBg : "transparent",
                color: isActive ? "#0f6e56" : "rgba(15,15,14,0.65)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                fontFamily: T.font,
                cursor: "pointer",
                marginBottom: 1,
                textAlign: "left",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              title={m.desc}
            >
              <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: "center" }}>{m.icon}</span>
              {!collapsed && (
                <div>
                  <div>{m.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: T.textTer, marginTop: 1 }}>{m.desc}</div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: collapsed ? "12px 0" : "12px 14px",
          borderTop: `0.5px solid ${T.borderSec}`,
          fontSize: 10,
          color: T.textTer,
          textAlign: collapsed ? "center" : "left",
          fontFamily: T.font,
        }}
      >
        {!collapsed && "Demo Kantoor · Pro"}
      </div>
    </aside>
  );
}
