"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/design-tokens";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via reset link — ready to set new password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }

    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens bevatten");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/auth/login"), 2000);
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

        {success ? (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, fontFamily: T.font }}>Wachtwoord bijgewerkt</h2>
            <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>U wordt doorgestuurd naar de inlogpagina…</p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, fontFamily: T.font }}>Nieuw wachtwoord</h2>
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 24, fontFamily: T.font }}>Kies een nieuw wachtwoord voor uw account</p>

            {error && <div style={{ background: T.dangerBg, color: T.dangerText, padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, fontFamily: T.font }}>{error}</div>}

            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>Nieuw wachtwoord</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimaal 8 tekens" required minLength={8}
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 5 }}>Bevestig wachtwoord</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Herhaal wachtwoord" required minLength={8}
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", color: T.text, background: T.bgCard, fontFamily: T.font }} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: loading ? "#b2d8cd" : T.accent, color: "#fff", fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: T.font }}>
                {loading ? "Bijwerken…" : "Wachtwoord bijwerken"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
