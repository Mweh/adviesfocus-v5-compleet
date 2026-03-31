import { useState, useMemo } from "react";

// ─── Design tokens (zelfde als module A) ────────────────────────────────────
const T = {
  bg: "#f7f6f3", bgCard: "#ffffff", bgSec: "#f1efe8",
  border: "rgba(15,15,14,0.10)", borderSec: "rgba(15,15,14,0.06)",
  text: "#0f0f0e", textSec: "rgba(15,15,14,0.55)", textTer: "rgba(15,15,14,0.38)",
  accent: "#1d9e75", accentBg: "#e0f2ee",
  warn: "#ef9f27", warnBg: "#faeeda", warnText: "#854f0b",
  danger: "#e24b4a", dangerBg: "#fcebeb", dangerText: "#a32d2d",
  blue: "#185fa5", blueBg: "#e6f1fb",
  purple: "#5b4fcf", purpleBg: "#edeaf8",
  font: "'DM Sans', system-ui, sans-serif",
  mono: "'DM Mono', monospace",
};

// ─── Constanten ───────────────────────────────────────────────────────────────
const AANBIEDERS_OPTIES = [
  "Nationale-Nederlanden","ASR","Aegon","Centraal Beheer","a.s.r.","Zwitserleven",
  "Reaal","BrandNewDay","PGB","Achmea","ABN AMRO Verzekeringen","Allianz","Anders",
];

const LIFECYCLE_OPTIES = ["Neutraal","Defensief","Offensief","Maatwerk mogelijk","Vastrentend only"];
const KEUZEBEGELEIDING_OPTIES = ["Ja – volledig portaal","Ja – basis tools","Beperkt","Nee"];
const NABESTAANDEN_OPTIES = ["Ja – ANW-volgend","Ja – vast bedrag","Beperkt","Nee"];

// Scoregewichten: per werkgeversdoelstelling
const WEGINGEN = {
  goedkoopst:    { premie:40, kosten:30, lifecycle:10, nabestaanden:10, keuzebegeleiding:10 },
  beste_dekking: { premie:10, kosten:10, lifecycle:20, nabestaanden:35, keuzebegeleiding:25 },
  meeste_keuze:  { premie:15, kosten:10, lifecycle:25, nabestaanden:15, keuzebegeleiding:35 },
};

// Scores berekenen per veld (hoger = beter)
function scoreVeld(veld, waarde, alleWaarden) {
  if (veld === "premie" || veld === "kosten") {
    // Lager is beter → inversie
    const nums = alleWaarden.filter(v => v > 0);
    if (!nums.length || !waarde) return 0;
    const min = Math.min(...nums), max = Math.max(...nums);
    return max === min ? 100 : Math.round((1 - (waarde - min) / (max - min)) * 100);
  }
  if (veld === "lifecycle") {
    return { "Maatwerk mogelijk":100, "Offensief":85, "Neutraal":70, "Defensief":55, "Vastrentend only":30 }[waarde] ?? 0;
  }
  if (veld === "nabestaanden") {
    return { "Ja – ANW-volgend":100, "Ja – vast bedrag":75, "Beperkt":40, "Nee":0 }[waarde] ?? 0;
  }
  if (veld === "keuzebegeleiding") {
    return { "Ja – volledig portaal":100, "Ja – basis tools":70, "Beperkt":35, "Nee":0 }[waarde] ?? 0;
  }
  return 0;
}

function berekenTotaalScore(offerte, alleOffertes, weging) {
  const w = WEGINGEN[weging];
  const premies    = alleOffertes.map(o => parseFloat(o.premie)||0);
  const kosten     = alleOffertes.map(o => parseFloat(o.kosten)||0);

  const sPremie    = scoreVeld("premie",           parseFloat(offerte.premie)||0,      premies);
  const sKosten    = scoreVeld("kosten",            parseFloat(offerte.kosten)||0,      kosten);
  const sLifecycle = scoreVeld("lifecycle",         offerte.lifecycle,                  []);
  const sNab       = scoreVeld("nabestaanden",      offerte.nabestaanden,               []);
  const sKeuze     = scoreVeld("keuzebegeleiding",  offerte.keuzebegeleiding,           []);

  return Math.round(
    (sPremie    * w.premie +
     sKosten    * w.kosten +
     sLifecycle * w.lifecycle +
     sNab       * w.nabestaanden +
     sKeuze     * w.keuzebegeleiding) / 100
  );
}

const leeg = (id) => ({
  id,
  aanbieder:"", premie:"", kosten:"", lifecycle:"", nabestaanden:"",
  keuzebegeleiding:"", urm:"", notitie:"", status:"concept",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (n) => n != null && n !== "" ? `${parseFloat(n).toFixed(2)}%` : "—";

function ScoreBalk({ score, max=100 }) {
  const kleur = score >= 70 ? T.accent : score >= 45 ? T.warn : T.danger;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, background:T.bgSec, borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${(score/max)*100}%`, height:"100%", background:kleur, borderRadius:3, transition:"width .3s" }} />
      </div>
      <span style={{ fontSize:12, fontWeight:700, color:kleur, fontFamily:T.mono, width:32, textAlign:"right" }}>{score}</span>
    </div>
  );
}

function Badge({ label, color, bg }) {
  return <span style={{ fontSize:10, fontWeight:600, color, background:bg, padding:"2px 7px", borderRadius:99, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</span>;
}

function Veld({ label, children, required }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", marginBottom:5, fontFamily:T.font }}>
        {label}{required && <span style={{ color:T.danger }}> *</span>}
      </div>
      {children}
    </div>
  );
}

function TextInvoer({ value, onChange, placeholder, prefix, suffix }) {
  return (
    <div style={{ position:"relative" }}>
      {prefix && <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:12, color:T.textTer, fontFamily:T.mono, pointerEvents:"none" }}>{prefix}</span>}
      <input
        value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} type="number" step="0.01"
        style={{ width:"100%", padding:`8px ${suffix?"28px":"10px"} 8px ${prefix?"22px":"10px"}`,
          borderRadius:7, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.mono,
          color:T.text, background:T.bgCard, outline:"none", boxSizing:"border-box" }}
        onFocus={e=>e.target.style.borderColor=T.accent}
        onBlur={e=>e.target.style.borderColor=T.border}
      />
      {suffix && <span style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", fontSize:12, color:T.textTer, fontFamily:T.mono }}>{suffix}</span>}
    </div>
  );
}

function SelectInvoer({ value, onChange, opties, placeholder }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${T.border}`,
        fontSize:13, fontFamily:T.font, color:value?T.text:T.textTer, background:T.bgCard, outline:"none" }}>
      <option value="">{placeholder}</option>
      {opties.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function TekstArea({ value, onChange, placeholder }) {
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2}
      style={{ width:"100%", padding:"8px 10px", borderRadius:7, border:`1px solid ${T.border}`,
        fontSize:12, fontFamily:T.font, color:T.text, background:T.bgCard, outline:"none",
        resize:"vertical", boxSizing:"border-box", lineHeight:1.5 }}
      onFocus={e=>e.target.style.borderColor=T.accent}
      onBlur={e=>e.target.style.borderColor=T.border}
    />
  );
}

// ─── Offerte invoerkaart ───────────────────────────────────────────────────────
function OfferteKaart({ offerte, index, onChange, onVerwijder, totaalScore, isWinnaar, weging }) {
  const [open, setOpen] = useState(true);
  const up = (veld, val) => onChange({ ...offerte, [veld]: val });

  const scoreKleur = totaalScore >= 70 ? T.accent : totaalScore >= 45 ? T.warn : T.danger;

  return (
    <div style={{ background:T.bgCard, border:`1px solid ${isWinnaar?T.accent:T.border}`, borderRadius:12,
      boxShadow: isWinnaar ? `0 0 0 3px ${T.accent}22` : "none", overflow:"hidden" }}>

      {/* Header */}
      <div style={{ padding:"12px 14px", background: isWinnaar ? T.accentBg : T.bgSec, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:26, height:26, borderRadius:"50%", background: isWinnaar?T.accent:T.border,
          color:isWinnaar?"#fff":T.textTer, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:11, fontWeight:700, fontFamily:T.mono, flexShrink:0 }}>
          {index+1}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <select value={offerte.aanbieder} onChange={e=>up("aanbieder",e.target.value)}
            style={{ width:"100%", background:"transparent", border:"none", fontSize:14, fontWeight:600,
              fontFamily:T.font, color:offerte.aanbieder?T.text:T.textTer, outline:"none", cursor:"pointer" }}>
            <option value="">— Aanbieder kiezen —</option>
            {AANBIEDERS_OPTIES.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {isWinnaar && <Badge label="Beste score" color={T.accent} bg="#fff" />}
          {offerte.aanbieder && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:T.textTer, fontFamily:T.font }}>Score</div>
              <div style={{ fontSize:18, fontWeight:700, color:scoreKleur, fontFamily:T.mono, lineHeight:1 }}>{totaalScore}</div>
            </div>
          )}
          <button onClick={() => setOpen(o=>!o)}
            style={{ width:28, height:28, borderRadius:7, border:`1px solid ${T.border}`, background:T.bgCard,
              cursor:"pointer", fontSize:14, color:T.textTer, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {open ? "▲" : "▼"}
          </button>
          <button onClick={onVerwijder}
            style={{ width:28, height:28, borderRadius:7, border:`1px solid ${T.border}`, background:T.bgCard,
              cursor:"pointer", fontSize:14, color:T.textTer, display:"flex", alignItems:"center", justifyContent:"center" }}>
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding:"14px 14px 10px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
            <Veld label="Vlakke premie (% van grondslag)" required>
              <TextInvoer value={offerte.premie} onChange={v=>up("premie",v)} placeholder="18.50" suffix="%" />
            </Veld>
            <Veld label="Uitvoeringskosten (% van premie)" required>
              <TextInvoer value={offerte.kosten} onChange={v=>up("kosten",v)} placeholder="0.35" suffix="%" />
            </Veld>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
            <Veld label="Lifecycle opties">
              <SelectInvoer value={offerte.lifecycle} onChange={v=>up("lifecycle",v)} opties={LIFECYCLE_OPTIES} placeholder="Selecteer…" />
            </Veld>
            <Veld label="Nabestaandenpensioen">
              <SelectInvoer value={offerte.nabestaanden} onChange={v=>up("nabestaanden",v)} opties={NABESTAANDEN_OPTIES} placeholder="Selecteer…" />
            </Veld>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
            <Veld label="Keuzebegeleiding voor werknemers">
              <SelectInvoer value={offerte.keuzebegeleiding} onChange={v=>up("keuzebegeleiding",v)} opties={KEUZEBEGELEIDING_OPTIES} placeholder="Selecteer…" />
            </Veld>
            <Veld label="URM-projectie beschikbaar">
              <div style={{ display:"flex", gap:6, paddingTop:2 }}>
                {["Ja","Nee","Op aanvraag"].map(o=>{
                  const sel = offerte.urm===o;
                  return <button key={o} onClick={()=>up("urm",o)}
                    style={{ padding:"6px 12px", borderRadius:99, fontSize:12, border:`1px solid ${sel?T.accent:T.border}`,
                      background:sel?T.accent:T.bgSec, color:sel?"#fff":T.textSec, cursor:"pointer", fontFamily:T.font }}>{o}</button>;
                })}
              </div>
            </Veld>
          </div>

          <Veld label="Notities / bijzondere voorwaarden">
            <TekstArea value={offerte.notitie} onChange={v=>up("notitie",v)} placeholder="Bijv. minimale contractduur, winstdeling, transitievergoeding aanbieder…" />
          </Veld>

          {/* Document upload hint */}
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:T.bgSec, borderRadius:8, marginTop:4 }}>
            <span style={{ fontSize:16 }}>📎</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:500, color:T.text, fontFamily:T.font }}>Offertedocument</div>
              <div style={{ fontSize:10, color:T.textTer, fontFamily:T.font }}>Upload de volledige offerte als PDF voor het dossier</div>
            </div>
            <button style={{ padding:"5px 11px", borderRadius:7, border:`1px solid ${T.border}`, background:T.bgCard,
              fontSize:11, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>
              + Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vergelijkingstabel ───────────────────────────────────────────────────────
function VergelijkingsTabel({ offertes, scores, winnaarId }) {
  const velden = [
    { key:"premie",          label:"Vlakke premie",         fmt: v=>pct(v) },
    { key:"kosten",          label:"Uitvoeringskosten",      fmt: v=>pct(v) },
    { key:"lifecycle",       label:"Lifecycle",              fmt: v=>v||"—" },
    { key:"nabestaanden",    label:"Nabestaanden",           fmt: v=>v||"—" },
    { key:"keuzebegeleiding",label:"Keuzebegeleiding",       fmt: v=>v||"—" },
    { key:"urm",             label:"URM beschikbaar",        fmt: v=>v||"—" },
  ];

  const gevuld = offertes.filter(o => o.aanbieder);
  if (!gevuld.length) return null;

  return (
    <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font }}>Vergelijkingstabel</div>
        <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>{gevuld.length} aanbieders ingevuld</span>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:T.bgSec }}>
              <th style={{ padding:"8px 14px", textAlign:"left", fontSize:11, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", fontFamily:T.font, borderBottom:`1px solid ${T.border}` }}>
                Kenmerk
              </th>
              {gevuld.map(o => (
                <th key={o.id} style={{ padding:"8px 14px", textAlign:"center", fontSize:12, fontWeight:600,
                  color: o.id===winnaarId ? T.accent : T.text, fontFamily:T.font,
                  borderBottom:`1px solid ${T.border}`,
                  background: o.id===winnaarId ? T.accentBg : T.bgSec }}>
                  {o.aanbieder}
                  {o.id===winnaarId && <div style={{ fontSize:9, color:T.accent, fontWeight:500 }}>★ beste score</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {velden.map((v, vi) => (
              <tr key={v.key} style={{ background: vi%2===0 ? T.bgCard : "#fafaf8" }}>
                <td style={{ padding:"7px 14px", fontSize:12, color:T.textSec, fontFamily:T.font, borderBottom:`0.5px solid ${T.borderSec}` }}>
                  {v.label}
                </td>
                {gevuld.map(o => {
                  const waarde = o[v.key];
                  const isWinnaar = o.id === winnaarId;
                  return (
                    <td key={o.id} style={{ padding:"7px 14px", fontSize:12, fontFamily:T.mono,
                      textAlign:"center", borderBottom:`0.5px solid ${T.borderSec}`,
                      color: waarde ? T.text : T.textTer,
                      background: isWinnaar ? `${T.accent}06` : "transparent" }}>
                      {v.fmt(waarde)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Totaalscore rij */}
            <tr style={{ background:T.bgSec, borderTop:`1px solid ${T.border}` }}>
              <td style={{ padding:"10px 14px", fontSize:12, fontWeight:700, color:T.text, fontFamily:T.font }}>
                Totaalscore
              </td>
              {gevuld.map(o => {
                const s = scores[o.id] ?? 0;
                return (
                  <td key={o.id} style={{ padding:"10px 14px", textAlign:"center" }}>
                    <ScoreBalk score={s} />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Aanbeveling card ─────────────────────────────────────────────────────────
function AanbevelingCard({ winnaar, score, weging, onNaarC }) {
  if (!winnaar?.aanbieder) return null;
  return (
    <div style={{ background:T.accentBg, border:`1px solid ${T.accent}44`, borderRadius:12, padding:"16px 18px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.accent, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4, fontFamily:T.font }}>
            ★ Aanbevolen aanbieder
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:T.font, marginBottom:4 }}>
            {winnaar.aanbieder}
          </div>
          <div style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>
            Score <strong style={{ fontFamily:T.mono, color:T.accent }}>{score}</strong>/100 ·
            Op basis van profiel:{" "}
            <strong>{{goedkoopst:"Goedkoopst", beste_dekking:"Beste dekking", meeste_keuze:"Meeste keuze"}[weging]}</strong>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
            {winnaar.premie && <Badge label={`Premie ${pct(winnaar.premie)}`} color={T.accent} bg="#fff" />}
            {winnaar.lifecycle && <Badge label={winnaar.lifecycle} color={T.blue} bg={T.blueBg} />}
            {winnaar.nabestaanden && <Badge label={winnaar.nabestaanden} color={T.textSec} bg={T.bgSec} />}
          </div>
        </div>
        <button onClick={onNaarC}
          style={{ flexShrink:0, padding:"10px 18px", borderRadius:9, background:T.accent, color:"#fff",
            border:"none", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:T.font,
            display:"flex", alignItems:"center", gap:6 }}>
          Naar beleggingsbeleid
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin:"round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Opslaan footer ───────────────────────────────────────────────────────────
function OpslaanFooterB({ aantalIngevuld, onNaarC }) {
  const [status, setStatus] = useState("idle");
  const opslaan = () => {
    setStatus("saving");
    setTimeout(() => { setStatus("saved"); setTimeout(()=>setStatus("idle"),3000); }, 800);
  };
  return (
    <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"14px 18px",
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
      <div style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>
        {status==="saved"
          ? <span style={{ color:T.accent, fontWeight:500 }}>✓ Vergelijking opgeslagen in dossier</span>
          : <span style={{ color:T.textTer }}>{aantalIngevuld} van de ingevoerde offertes worden opgeslagen</span>}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={opslaan} disabled={status==="saving"}
          style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${status==="saved"?T.accent:T.border}`,
            background:status==="saved"?T.accentBg:T.bgSec, color:status==="saved"?T.accent:T.text,
            fontSize:13, fontWeight:500, cursor:status==="saving"?"not-allowed":"pointer", fontFamily:T.font,
            opacity:status==="saving"?0.6:1 }}>
          {status==="saving" ? "Opslaan…" : status==="saved" ? "✓ Opgeslagen" : "Vergelijking opslaan"}
        </button>
        <button onClick={onNaarC}
          style={{ padding:"9px 18px", borderRadius:8, border:"none", background:T.accent, color:"#fff",
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:T.font, display:"flex", alignItems:"center", gap:7 }}>
          Naar beleggingsbeleid
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────
export default function ModuleB({ onTerug, onNaarC }) {
  const [offertes, setOffertes] = useState([leeg(1), leeg(2), leeg(3)]);
  const [weging, setWeging]     = useState("goedkoopst");

  const updateOfferte = (id, data) =>
    setOffertes(prev => prev.map(o => o.id===id ? data : o));

  const verwijderOfferte = (id) =>
    setOffertes(prev => prev.filter(o => o.id!==id));

  const voegToe = () => {
    const nieuweId = Math.max(...offertes.map(o=>o.id)) + 1;
    setOffertes(prev => [...prev, leeg(nieuweId)]);
  };

  // Scores berekenen
  const scores = useMemo(() => {
    const gevuld = offertes.filter(o=>o.aanbieder);
    const result = {};
    gevuld.forEach(o => {
      result[o.id] = berekenTotaalScore(o, gevuld, weging);
    });
    return result;
  }, [offertes, weging]);

  const winnaarId = useMemo(() => {
    const gevuld = offertes.filter(o=>o.aanbieder);
    if (!gevuld.length) return null;
    return gevuld.reduce((best, o) => (scores[o.id]??0) > (scores[best.id]??0) ? o : best, gevuld[0]).id;
  }, [scores, offertes]);

  const winnaar = offertes.find(o=>o.id===winnaarId);
  const aantalIngevuld = offertes.filter(o=>o.aanbieder).length;

  return (
    <div style={{ fontFamily:T.font, maxWidth:920, margin:"0 auto", padding:"0 0 32px" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4, fontFamily:T.font }}>
            Analyse · Module 2.2
          </div>
          <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:700, color:T.text, fontFamily:T.font }}>
            Markt- & Productvergelijking
          </h2>
          <p style={{ margin:0, fontSize:13, color:T.textSec, fontFamily:T.font }}>
            Voer offertes van minimaal 3 aanbieders in. Scores worden automatisch berekend op basis van het werkgeversprofiel.
          </p>
        </div>
        <button onClick={onTerug}
          style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8,
            border:`1px solid ${T.border}`, background:T.bgSec, fontSize:12, cursor:"pointer",
            fontFamily:T.font, color:T.textSec, flexShrink:0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Terug naar transitie
        </button>
      </div>

      {/* Scoregewicht instellen */}
      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, fontFamily:T.font }}>
          Scoremodel — werkgeversprofiel
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[
            { id:"goedkoopst",    label:"Goedkoopst",      icon:"💰", desc:"40% premie · 30% kosten · rest gelijk" },
            { id:"beste_dekking", label:"Beste dekking",   icon:"🛡", desc:"35% nabestaanden · 25% keuzebeg. · rest gelijk" },
            { id:"meeste_keuze",  label:"Meeste keuze",    icon:"🎯", desc:"35% keuzebeg. · 25% lifecycle · rest gelijk" },
          ].map(s => {
            const sel = weging===s.id;
            return (
              <div key={s.id} onClick={()=>setWeging(s.id)}
                style={{ flex:1, padding:"10px 12px", borderRadius:9, border:`1px solid ${sel?T.accent:T.border}`,
                  background:sel?T.accentBg:T.bgSec, cursor:"pointer", transition:"all .12s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                  <span style={{ fontSize:14 }}>{s.icon}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:sel?T.accent:T.text, fontFamily:T.font }}>{s.label}</span>
                  {sel && <span style={{ marginLeft:"auto", fontSize:9, background:T.accent, color:"#fff", padding:"1px 6px", borderRadius:99 }}>Actief</span>}
                </div>
                <div style={{ fontSize:10, color:T.textTer, fontFamily:T.font }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status banner als < 3 aanbieders */}
      {aantalIngevuld < 3 && (
        <div style={{ background:T.warnBg, border:`0.5px solid ${T.warn}44`, borderRadius:9, padding:"9px 14px",
          fontSize:12, color:T.warnText, fontFamily:T.font, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>⚠</span>
          <span>AFM-richtlijn vereist vergelijking van minimaal 3 aanbieders. Momenteel {aantalIngevuld} ingevuld.</span>
        </div>
      )}

      {/* Offerte kaarten */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        {offertes.map((o, i) => (
          <OfferteKaart
            key={o.id}
            offerte={o}
            index={i}
            onChange={(data) => updateOfferte(o.id, data)}
            onVerwijder={() => verwijderOfferte(o.id)}
            totaalScore={scores[o.id] ?? 0}
            isWinnaar={o.id === winnaarId && !!o.aanbieder}
            weging={weging}
          />
        ))}
      </div>

      {/* Aanbieder toevoegen */}
      {offertes.length < 6 && (
        <button onClick={voegToe}
          style={{ width:"100%", padding:"11px", borderRadius:10, border:`1.5px dashed ${T.border}`,
            background:T.bgSec, color:T.textSec, fontSize:13, fontWeight:500, cursor:"pointer",
            fontFamily:T.font, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Aanbieder toevoegen ({offertes.length}/6)
        </button>
      )}

      {/* Vergelijkingstabel */}
      {aantalIngevuld >= 2 && (
        <div style={{ marginBottom:16 }}>
          <VergelijkingsTabel offertes={offertes} scores={scores} winnaarId={winnaarId} />
        </div>
      )}

      {/* Aanbeveling */}
      {winnaar?.aanbieder && scores[winnaarId] > 0 && (
        <div style={{ marginBottom:16 }}>
          <AanbevelingCard winnaar={winnaar} score={scores[winnaarId]} weging={weging} onNaarC={onNaarC} />
        </div>
      )}

      {/* Footer */}
      <OpslaanFooterB aantalIngevuld={aantalIngevuld} onNaarC={onNaarC} />
    </div>
  );
}
