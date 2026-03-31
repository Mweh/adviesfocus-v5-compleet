"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/design-tokens";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message === "Invalid login credentials") {
        setError("Ongeldige inloggegevens. Controleer uw e-mail en wachtwoord.");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("E-mailadres nog niet bevestigd. Controleer uw inbox.");
      } else if (authError.message.includes("Too many requests")) {
        setError("Te veel inlogpogingen. Probeer het over enkele minuten opnieuw.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
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

        <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, fontFamily: T.font }}>Inloggen</h2>
        <p style={{ fontSize: 13, color: T.textSec, marginBottom: 24, fontFamily: T.font }}>Log in op uw AdviesFocus account</p>

        {error && <div style={{ background: T.dangerBg, color: T.dangerText, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, fontFamily: T.font }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>E-mailadres</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@kantoor.nl" required
              style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>Wachtwoord</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: loading ? "#b2d8cd" : T.accent, color: "#fff", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: T.font }}>
            {loading ? "Bezig met inloggen…" : "Inloggen"}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 12 }}>
          <Link href="/auth/reset" style={{ color: T.accent, textDecoration: "none", fontFamily: T.font }}>Wachtwoord vergeten?</Link>
          <Link href="/auth/register" style={{ color: T.accent, textDecoration: "none", fontFamily: T.font }}>Account aanmaken</Link>
        </div>
      </div>
    </div>
  );
}
