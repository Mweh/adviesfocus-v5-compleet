"use client";

import { useState } from "react";
import { T } from "@/lib/design-tokens";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: implement Supabase password reset
    setTimeout(() => { setSent(true); setLoading(false); }, 1000);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg }}>
      <div style={{ background: T.bgCard, borderRadius: 14, padding: "40px 36px", width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <svg width={28} height={28} viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="22" height="22" rx="4" fill="#0f0f0e" />
            <rect x="14" y="14" width="22" height="22" rx="4" fill="none" stroke="#0f0f0e" strokeWidth="1.5" />
            <rect x="16" y="16" width="8" height="8" rx="1.5" fill="#ffffff" />
          </svg>
          <span style={{ fontSize: 18, letterSpacing: "-.01em" }}>
            <span style={{ fontWeight: 300 }}>Advies</span>
            <span style={{ fontWeight: 600 }}>Focus</span>
          </span>
        </div>

        {sent ? (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, fontFamily: T.font }}>E-mail verstuurd</h2>
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 24, fontFamily: T.font }}>
              We hebben een reset-link verstuurd naar {email}. Controleer uw inbox.
            </p>
            <a href="/auth/login" style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: 8, background: T.accent, color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 500, fontFamily: T.font }}>
              Terug naar inloggen
            </a>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, fontFamily: T.font }}>Wachtwoord resetten</h2>
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 24, fontFamily: T.font }}>Voer uw e-mailadres in voor een reset-link</p>

            <form onSubmit={handleReset}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>E-mailadres</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@kantoor.nl" required
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: loading ? "#b2d8cd" : T.accent, color: "#fff", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: T.font }}>
                {loading ? "Versturen…" : "Reset-link versturen"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, fontFamily: T.font, color: T.textSec }}>
              <a href="/auth/login" style={{ color: T.accent, textDecoration: "none" }}>Terug naar inloggen</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
