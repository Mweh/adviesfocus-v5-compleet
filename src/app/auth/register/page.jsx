"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/design-tokens";

export default function RegisterPage() {
  const [f, setF] = useState({ naam: "", email: "", password: "", kantoor: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signUpError } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: {
        data: {
          naam: f.naam,
          kantoor_naam: f.kantoor,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Dit e-mailadres is al geregistreerd. Probeer in te loggen.");
      } else if (signUpError.message.includes("Password should be")) {
        setError("Wachtwoord moet minimaal 6 tekens bevatten.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg }}>
      <div style={{ background: T.bgCard, borderRadius: 14, padding: "40px 36px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
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

        {success ? (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, fontFamily: T.font }}>Account aangemaakt</h2>
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 24, fontFamily: T.font }}>
              We hebben een bevestigingslink verstuurd naar uw e-mailadres. Klik op de link om uw account te activeren.
            </p>
            <Link href="/auth/login" style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: 8, background: T.accent, color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 500, fontFamily: T.font }}>
              Ga naar inloggen
            </Link>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, fontFamily: T.font }}>Account aanmaken</h2>
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 24, fontFamily: T.font }}>Maak een nieuw adviseursaccount aan</p>

            {error && <div style={{ background: T.dangerBg, color: T.dangerText, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, fontFamily: T.font }}>{error}</div>}

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>Kantoornaam *</label>
                <input value={f.kantoor} onChange={(e) => set("kantoor", e.target.value)} placeholder="Pensioenadvies B.V." required
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>Naam *</label>
                <input value={f.naam} onChange={(e) => set("naam", e.target.value)} placeholder="J. de Vries" required
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>E-mailadres *</label>
                <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="naam@kantoor.nl" required
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>Wachtwoord *</label>
                <input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="Minimaal 8 tekens" required minLength={8}
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: loading ? "#b2d8cd" : T.accent, color: "#fff", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: T.font }}>
                {loading ? "Account aanmaken…" : "Account aanmaken"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, fontFamily: T.font, color: T.textSec }}>
              Al een account? <Link href="/auth/login" style={{ color: T.accent, textDecoration: "none" }}>Inloggen</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
