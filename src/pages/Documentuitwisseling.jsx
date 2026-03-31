import { useState, useRef } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:"#f7f6f3", bgCard:"#ffffff", bgSec:"#f1efe8",
  border:"rgba(15,15,14,0.10)", borderSec:"rgba(15,15,14,0.06)",
  text:"#0f0f0e", textSec:"rgba(15,15,14,0.55)", textTer:"rgba(15,15,14,0.38)",
  accent:"#1d9e75", accentBg:"#e0f2ee",
  warn:"#ef9f27", warnBg:"#faeeda", warnText:"#854f0b",
  danger:"#e24b4a", dangerBg:"#fcebeb", dangerText:"#a32d2d",
  blue:"#185fa5", blueBg:"#e6f1fb",
  purple:"#5b4fcf", purpleBg:"#edeaf8",
  font:"'DM Sans', system-ui, sans-serif",
  mono:"'DM Mono', monospace",
};

// ─── Constanten ───────────────────────────────────────────────────────────────
const RICHTINGEN = {
  adviseur_naar_werkgever: { label:"Adviseur → Werkgever", kleur:T.accent,  bg:T.accentBg,  icon:"📤" },
  werkgever_naar_adviseur: { label:"Werkgever → Adviseur", kleur:T.blue,    bg:T.blueBg,    icon:"📥" },
  adviseur_naar_werknemer: { label:"Adviseur → Werknemer", kleur:T.purple,  bg:T.purpleBg,  icon:"👤" },
  werknemer_naar_adviseur: { label:"Werknemer → Adviseur", kleur:T.warn,    bg:T.warnBg,    icon:"📋" },
};

const CATEGORIEEN = {
  adviseur_naar_werkgever: ["Adviesrapport","Auditrapport","Offertevergelijking","Transitieplan","Overig"],
  werkgever_naar_adviseur: ["Jaarrekening","Salarisoverzicht","CAO-document","OR-notulen","Overig"],
  adviseur_naar_werknemer: ["Was-wordt brief","Pensioenbrief","UPO","Polisblad","Overig"],
  werknemer_naar_adviseur: ["Instemmingsformulier","Bijlage bij vraag","Overig"],
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_DOCS = [
  { id:"d1", naam:"Adviesrapport Q1 2026", categorie:"Adviesrapport", richting:"adviseur_naar_werkgever", aangemaakt_op:"2026-03-28", status:"gedeeld", ontvanger:"J. de Vries", downloads:1, geldig_tot:"2026-04-27", bestandsgrootte:245000, token:"a1b2c3" },
  { id:"d2", naam:"Jaarrekening 2024", categorie:"Jaarrekening", richting:"werkgever_naar_adviseur", aangemaakt_op:"2026-03-20", status:"ontvangen", ontvanger:"D. Wietzema Menkhorst", downloads:0, geldig_tot:null, bestandsgrootte:1820000 },
  { id:"d3", naam:"Auditrapport WTP 2025", categorie:"Auditrapport", richting:"adviseur_naar_werkgever", aangemaakt_op:"2026-02-14", status:"gedeeld", ontvanger:"J. de Vries", downloads:3, geldig_tot:"2026-03-16", bestandsgrootte:189000, token:"x9y8z7" },
  { id:"d4", naam:"Was-wordt brief — H. van Dijk", categorie:"Was-wordt brief", richting:"adviseur_naar_werknemer", aangemaakt_op:"2026-03-25", status:"gelezen", ontvanger:"H. van Dijk", downloads:1, geldig_tot:"2026-04-24", bestandsgrootte:95000, token:"p3q4r5" },
  { id:"d5", naam:"Instemmingsformulier — B. Janssen", categorie:"Instemmingsformulier", richting:"werknemer_naar_adviseur", aangemaakt_op:"2026-03-26", status:"ontvangen", ontvanger:"D. Wietzema Menkhorst", downloads:0, geldig_tot:null, bestandsgrootte:42000 },
  { id:"d6", naam:"Salarisoverzicht maart 2026", categorie:"Salarisoverzicht", richting:"werkgever_naar_adviseur", aangemaakt_op:"2026-03-27", status:"ontvangen", ontvanger:"D. Wietzema Menkhorst", downloads:0, geldig_tot:null, bestandsgrootte:380000 },
];

const MOCK_UPLOAD_TOKENS = [
  { id:"t1", label:"Upload-link werkgever", aanvrager:"J. de Vries (Oranje Techniek B.V.)", email:"j.devries@oranjetechniek.nl", geldig_tot:"2026-04-11", uploads:2, max:10, token:"wg_abc123def456" },
];

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────
const kb = n => n > 1024*1024 ? `${(n/1024/1024).toFixed(1)} MB` : `${Math.round(n/1024)} KB`;
const datumNL = s => new Date(s).toLocaleDateString("nl-NL", { day:"2-digit", month:"short", year:"numeric" });
const isVerlopen = s => s && new Date(s) < new Date();

function Pill({ label, kleur, bg }) {
  return <span style={{ fontSize:10, fontWeight:600, color:kleur, background:bg, padding:"2px 8px", borderRadius:99, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".04em", whiteSpace:"nowrap" }}>{label}</span>;
}

function StatusPill({ status }) {
  const map = {
    gedeeld:  { label:"Gedeeld",   kleur:T.accent,      bg:T.accentBg },
    ontvangen:{ label:"Ontvangen", kleur:T.blue,        bg:T.blueBg },
    gelezen:  { label:"Gelezen ✓", kleur:T.accent,      bg:T.accentBg },
    verlopen: { label:"Verlopen",  kleur:T.textTer,     bg:T.bgSec },
    nieuw:    { label:"Nieuw",     kleur:T.warn,        bg:T.warnBg },
  };
  const s = map[status] || map.ontvangen;
  return <Pill label={s.label} kleur={s.kleur} bg={s.bg} />;
}

function IconBtn({ icon, label, onClick, kleur=T.accent, bg=T.accentBg, disabled=false }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 11px", borderRadius:7, border:`1px solid ${kleur}44`, background:bg, color:kleur, fontSize:11, fontWeight:500, cursor:disabled?"not-allowed":"pointer", fontFamily:T.font, opacity:disabled?0.4:1, whiteSpace:"nowrap" }}>
      <span>{icon}</span>{label}
    </button>
  );
}

// ─── Link kopieer knop ────────────────────────────────────────────────────────
function KopieerLink({ token, richting }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  const isUpload = richting === "werkgever_naar_adviseur";
  const url = isUpload
    ? `https://app.adviesfocus.nl/upload/${token}`
    : `https://app.adviesfocus.nl/download/${token}`;

  const kopieer = () => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setGekopieerd(true);
    setTimeout(() => setGekopieerd(false), 2000);
  };

  return (
    <button onClick={kopieer}
      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:6, border:`1px solid ${T.border}`, background:gekopieerd?T.accentBg:T.bgSec, color:gekopieerd?T.accent:T.textSec, fontSize:11, cursor:"pointer", fontFamily:T.font, transition:"all .15s" }}>
      {gekopieerd ? "✓ Gekopieerd" : "🔗 Kopieer link"}
    </button>
  );
}

// ─── Nieuw document deel modal ─────────────────────────────────────────────────
function DeelModal({ onClose, onDeel }) {
  const [stap, setStap]         = useState(1);
  const [richting, setRichting] = useState("");
  const [categorie, setCategorie]= useState("");
  const [naam, setNaam]         = useState("");
  const [email, setEmail]       = useState("");
  const [notitie, setNotitie]   = useState("");
  const [bestand, setBestand]   = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [geldigheid, setGeldigheid] = useState(30);
  const fileRef = useRef(null);

  const isUpload = richting === "werkgever_naar_adviseur" || richting === "werknemer_naar_adviseur";
  const kleur = richting ? RICHTINGEN[richting]?.kleur : T.accent;

  const stap2Klaar = richting && categorie && naam && email;
  const stap3Klaar = isUpload || bestand;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,15,14,0.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:T.bgCard, borderRadius:16, width:560, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.25)" }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"20px 22px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h3 style={{ margin:"0 0 3px", fontSize:16, fontWeight:700, color:T.text, fontFamily:T.font }}>Document delen of uitvragen</h3>
            <p style={{ margin:0, fontSize:12, color:T.textSec, fontFamily:T.font }}>Stuur een beveiligd document of genereer een upload-link</p>
          </div>
          <button onClick={onClose} style={{ background:T.bgSec, border:`1px solid ${T.border}`, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, color:T.textTer }}>×</button>
        </div>

        {/* Stappen */}
        <div style={{ display:"flex", gap:0, margin:"16px 22px 0", borderRadius:8, overflow:"hidden", border:`1px solid ${T.border}` }}>
          {[["1","Richting"],["2","Details"],["3","Bestand"]].map(([n, l], i) => {
            const actief = stap === i+1;
            const klaar  = stap > i+1;
            return (
              <div key={n} style={{ flex:1, padding:"8px 0", textAlign:"center", background:actief?kleur:klaar?T.accentBg:T.bgSec, borderRight:i<2?`1px solid ${T.border}`:"none" }}>
                <div style={{ fontSize:11, fontWeight:600, color:actief?"#fff":klaar?T.accent:T.textTer, fontFamily:T.font }}>{klaar?"✓":n}  {l}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding:"18px 22px 22px" }}>

          {/* ── Stap 1: Richting ── */}
          {stap === 1 && (
            <div>
              <div style={{ fontSize:12, color:T.textSec, marginBottom:12, fontFamily:T.font }}>Selecteer de richting van dit document:</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {Object.entries(RICHTINGEN).map(([key, r]) => {
                  const sel = richting === key;
                  return (
                    <div key={key} onClick={()=>setRichting(key)}
                      style={{ padding:"12px 14px", borderRadius:10, border:`1.5px solid ${sel?r.kleur:T.border}`, background:sel?r.bg:T.bgSec, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{ fontSize:20 }}>{r.icon}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:sel?r.kleur:T.text, fontFamily:T.font }}>{r.label}</div>
                        <div style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>
                          {{
                            adviseur_naar_werkgever: "Stuur een document met beveiligde download-link",
                            werkgever_naar_adviseur: "Genereer een upload-link voor de werkgever (geen account nodig)",
                            adviseur_naar_werknemer: "Stuur via werknemersportaal met leesbevestiging",
                            werknemer_naar_adviseur: "Genereer een upload-link voor de werknemer",
                          }[key]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
                <button onClick={()=>richting&&setStap(2)} disabled={!richting}
                  style={{ padding:"9px 20px", borderRadius:8, border:"none", background:richting?kleur:T.border, color:"#fff", fontSize:13, fontWeight:600, cursor:richting?"pointer":"not-allowed", fontFamily:T.font }}>
                  Volgende →
                </button>
              </div>
            </div>
          )}

          {/* ── Stap 2: Details ── */}
          {stap === 2 && (
            <div>
              {[
                ["Naam / omschrijving", naam, setNaam, "tekst", "bijv. Adviesrapport Q1 2026"],
                ["E-mailadres ontvanger", email, setEmail, "email", "naam@bedrijf.nl"],
              ].map(([label, val, setter, type, ph]) => (
                <div key={label} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:5, fontFamily:T.font }}>{label}</label>
                  <input type={type} value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                    style={{ width:"100%", padding:"8px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.bgSec, outline:"none", boxSizing:"border-box" }}
                    onFocus={e=>e.target.style.borderColor=kleur} onBlur={e=>e.target.style.borderColor=T.border} />
                </div>
              ))}

              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:5, fontFamily:T.font }}>Categorie</label>
                <select value={categorie} onChange={e=>setCategorie(e.target.value)}
                  style={{ width:"100%", padding:"8px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:categorie?T.text:T.textTer, background:T.bgSec, outline:"none" }}>
                  <option value="">Selecteer categorie…</option>
                  {(CATEGORIEEN[richting]||[]).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {!isUpload && (
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:5, fontFamily:T.font }}>Link geldig (dagen)</label>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <input type="range" min={7} max={90} step={7} value={geldigheid} onChange={e=>setGeldigheid(+e.target.value)} style={{ flex:1, accentColor:kleur }} />
                    <span style={{ fontSize:13, fontWeight:600, fontFamily:T.mono, color:kleur, width:60, textAlign:"right" }}>{geldigheid} dagen</span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom:4 }}>
                <label style={{ fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:5, fontFamily:T.font }}>Begeleidende notitie (optioneel)</label>
                <textarea value={notitie} onChange={e=>setNotitie(e.target.value)} rows={2} placeholder="Bijv. 'Bijgevoegd het definitieve adviesrapport. Heeft u vragen, neem dan contact op.'"
                  style={{ width:"100%", padding:"8px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, color:T.text, background:T.bgSec, outline:"none", resize:"vertical", boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor=kleur} onBlur={e=>e.target.style.borderColor=T.border} />
              </div>

              <div style={{ display:"flex", gap:8, justifyContent:"space-between", marginTop:16 }}>
                <button onClick={()=>setStap(1)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:12, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>← Terug</button>
                <button onClick={()=>stap2Klaar&&setStap(3)} disabled={!stap2Klaar}
                  style={{ padding:"9px 20px", borderRadius:8, border:"none", background:stap2Klaar?kleur:T.border, color:"#fff", fontSize:13, fontWeight:600, cursor:stap2Klaar?"pointer":"not-allowed", fontFamily:T.font }}>
                  Volgende →
                </button>
              </div>
            </div>
          )}

          {/* ── Stap 3: Bestand (of upload-link) ── */}
          {stap === 3 && (
            <div>
              {isUpload ? (
                <div>
                  <div style={{ background:T.blueBg, border:`0.5px solid ${T.blue}44`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.blue, marginBottom:4, fontFamily:T.font }}>🔗 Upload-link genereren</div>
                    <div style={{ fontSize:12, color:T.blue, fontFamily:T.font }}>
                      Er wordt een unieke upload-link gegenereerd voor <strong>{email}</strong>. Zij kunnen via deze link bestanden uploaden zonder een account aan te maken. De link is 14 dagen geldig.
                    </div>
                  </div>
                  <div style={{ padding:"10px 13px", background:T.bgSec, borderRadius:8, marginBottom:16 }}>
                    {[["Ontvanger", email], ["Categorie", categorie], ["Max uploads", "10 bestanden"], ["Max bestandsgrootte", "25 MB per bestand"], ["Geldig tot", "14 dagen"]].map(([l,v])=>(
                      <div key={l} style={{ display:"flex", padding:"4px 0", gap:12 }}>
                        <span style={{ fontSize:11, color:T.textTer, width:140, flexShrink:0, fontFamily:T.font }}>{l}</span>
                        <span style={{ fontSize:12, color:T.text, fontFamily:T.mono }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:12, color:T.textSec, marginBottom:10, fontFamily:T.font }}>Upload het bestand dat u wilt delen:</div>
                  <div
                    onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={e=>{e.preventDefault();setDragOver(false);setBestand(e.dataTransfer.files[0]);}}
                    onClick={()=>fileRef.current?.click()}
                    style={{ border:`2px dashed ${dragOver?kleur:T.border}`, borderRadius:10, padding:"24px 20px", textAlign:"center", cursor:"pointer", background:dragOver?T.accentBg:T.bgSec, marginBottom:12 }}>
                    <input ref={fileRef} type="file" style={{ display:"none" }} onChange={e=>setBestand(e.target.files[0])} />
                    {bestand ? (
                      <div>
                        <div style={{ fontSize:22, marginBottom:6 }}>📄</div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font }}>{bestand.name}</div>
                        <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font }}>{kb(bestand.size)}</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize:22, marginBottom:6 }}>📂</div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font }}>Sleep een bestand hierheen</div>
                        <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font }}>PDF, Word, Excel — max. 25 MB</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display:"flex", gap:8, justifyContent:"space-between" }}>
                <button onClick={()=>setStap(2)} style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:12, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>← Terug</button>
                <button onClick={()=>{ onDeel({ richting, categorie, naam, email, notitie, bestand, geldigheid, isUpload }); onClose(); }}
                  disabled={!isUpload && !bestand}
                  style={{ padding:"9px 20px", borderRadius:8, border:"none", background:(isUpload||bestand)?kleur:T.border, color:"#fff", fontSize:13, fontWeight:600, cursor:(isUpload||bestand)?"pointer":"not-allowed", fontFamily:T.font }}>
                  {isUpload ? "🔗 Link genereren" : "📤 Versturen & link genereren"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Documentrij ──────────────────────────────────────────────────────────────
function DocRij({ doc, onKopieer }) {
  const r = RICHTINGEN[doc.richting];
  const verlopen = isVerlopen(doc.geldig_tot);
  const status = verlopen && doc.status === "gedeeld" ? "verlopen" : doc.status;

  return (
    <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
      {/* Richting icoon */}
      <div style={{ width:36, height:36, borderRadius:9, background:r.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
        {r.icon}
      </div>

      {/* Naam en meta */}
      <div style={{ flex:1, minWidth:180 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2, fontFamily:T.font }}>{doc.naam}</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>{doc.categorie}</span>
          <span style={{ color:T.borderSec }}>·</span>
          <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>{kb(doc.bestandsgrootte)}</span>
          <span style={{ color:T.borderSec }}>·</span>
          <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>{datumNL(doc.aangemaakt_op)}</span>
        </div>
      </div>

      {/* Ontvanger */}
      <div style={{ textAlign:"right", minWidth:140 }}>
        <div style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>Ontvanger</div>
        <div style={{ fontSize:12, fontWeight:500, color:T.text, fontFamily:T.font }}>{doc.ontvanger}</div>
      </div>

      {/* Downloads */}
      <div style={{ textAlign:"center", minWidth:60 }}>
        <div style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>Downloads</div>
        <div style={{ fontSize:14, fontWeight:600, fontFamily:T.mono, color:doc.downloads>0?T.accent:T.textTer }}>{doc.downloads}</div>
      </div>

      {/* Status */}
      <StatusPill status={status} />

      {/* Acties */}
      <div style={{ display:"flex", gap:6 }}>
        {doc.token && !verlopen && <KopieerLink token={doc.token} richting={doc.richting} />}
        {verlopen && <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font, padding:"5px 10px" }}>Verlopen</span>}
        <button style={{ padding:"5px 9px", borderRadius:6, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:11, cursor:"pointer", color:T.textSec, fontFamily:T.font }}>⋯</button>
      </div>
    </div>
  );
}

// ─── Adviseur documentenmodule (hoofd) ────────────────────────────────────────
function AdviseurDocumenten() {
  const [docs, setDocs]           = useState(MOCK_DOCS);
  const [tokens, setTokens]       = useState(MOCK_UPLOAD_TOKENS);
  const [showDeel, setShowDeel]   = useState(false);
  const [filterRichting, setFilterRichting] = useState("alle");
  const [zoek, setZoek]           = useState("");
  const [bevestiging, setBevestiging] = useState(null);

  const gefilterd = docs.filter(d => {
    if (filterRichting !== "alle" && d.richting !== filterRichting) return false;
    if (zoek && !d.naam.toLowerCase().includes(zoek.toLowerCase()) && !d.ontvanger.toLowerCase().includes(zoek.toLowerCase())) return false;
    return true;
  });

  const handleDeel = (data) => {
    const nieuw = {
      id: `d${Date.now()}`,
      naam: data.naam,
      categorie: data.categorie,
      richting: data.richting,
      aangemaakt_op: new Date().toISOString().slice(0,10),
      status: data.isUpload ? "actief" : "gedeeld",
      ontvanger: data.email,
      downloads: 0,
      geldig_tot: data.isUpload ? null : new Date(Date.now() + data.geldigheid*86400000).toISOString().slice(0,10),
      bestandsgrootte: data.bestand?.size || 0,
      token: Math.random().toString(36).slice(2,8),
    };
    setDocs(p => [nieuw, ...p]);
    setBevestiging(data);
    setTimeout(() => setBevestiging(null), 4000);
  };

  // Statistieken
  const stats = {
    totaal:    docs.length,
    gedeeld:   docs.filter(d=>d.status==="gedeeld").length,
    ontvangen: docs.filter(d=>d.status==="ontvangen").length,
    gelezen:   docs.filter(d=>d.status==="gelezen").length,
  };

  return (
    <div>
      {/* Bevestiging toast */}
      {bevestiging && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:300, background:T.accentBg, border:`1px solid ${T.accent}44`, borderRadius:10, padding:"12px 16px", boxShadow:"0 8px 24px rgba(0,0,0,.12)", fontFamily:T.font }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.accent }}>
            {bevestiging.isUpload ? "🔗 Upload-link gegenereerd" : "📤 Document gedeeld"}
          </div>
          <div style={{ fontSize:11, color:T.accent, marginTop:2 }}>
            {bevestiging.isUpload ? `Link verstuurd naar ${bevestiging.email}` : `E-mail verstuurd naar ${bevestiging.email}`}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:"0 0 3px", fontSize:18, fontWeight:700, color:T.text, fontFamily:T.font }}>Documentuitwisseling</h2>
          <p style={{ margin:0, fontSize:13, color:T.textSec }}>Oranje Techniek B.V. — beveiligde twee-richtings uitwisseling</p>
        </div>
        <button onClick={()=>setShowDeel(true)}
          style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:9, border:"none", background:T.accent, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:T.font }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Document toevoegen
        </button>
      </div>

      {/* KPI's */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          ["Totaal", stats.totaal, T.text, T.bgCard],
          ["Gedeeld", stats.gedeeld, T.accent, T.accentBg],
          ["Ontvangen", stats.ontvangen, T.blue, T.blueBg],
          ["Gelezen ✓", stats.gelezen, T.accent, T.accentBg],
        ].map(([l,v,k,b]) => (
          <div key={l} style={{ background:b, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"10px 13px" }}>
            <div style={{ fontSize:10, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", marginBottom:3, fontFamily:T.font }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:k, fontFamily:T.mono }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Upload-tokens overzicht */}
      {tokens.length > 0 && (
        <div style={{ background:T.blueBg, border:`0.5px solid ${T.blue}44`, borderRadius:10, padding:"11px 14px", marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.blue, marginBottom:8, fontFamily:T.font }}>🔗 Actieve upload-links</div>
          {tokens.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:12, color:T.blue, fontFamily:T.font }}>{t.aanvrager} — {t.uploads}/{t.max} bestanden geüpload</span>
                <span style={{ fontSize:11, color:T.textTer, marginLeft:8, fontFamily:T.font }}>Geldig tot {datumNL(t.geldig_tot)}</span>
              </div>
              <KopieerLink token={t.token} richting="werkgever_naar_adviseur" />
            </div>
          ))}
        </div>
      )}

      {/* Filter + zoek */}
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <input value={zoek} onChange={e=>setZoek(e.target.value)} placeholder="Zoek document of ontvanger…"
          style={{ flex:1, minWidth:180, padding:"7px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, color:T.text, background:T.bgSec, outline:"none" }} />
        <select value={filterRichting} onChange={e=>setFilterRichting(e.target.value)}
          style={{ padding:"7px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, color:T.text, background:T.bgSec, outline:"none" }}>
          <option value="alle">Alle richtingen</option>
          {Object.entries(RICHTINGEN).map(([k,r]) => <option key={k} value={k}>{r.icon} {r.label}</option>)}
        </select>
      </div>

      {/* Documenten lijst */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {gefilterd.length === 0
          ? <div style={{ textAlign:"center", padding:"32px 0", color:T.textTer, fontFamily:T.font, fontSize:13 }}>Geen documenten gevonden</div>
          : gefilterd.map(doc => <DocRij key={doc.id} doc={doc} />)}
      </div>

      {showDeel && <DeelModal onClose={()=>setShowDeel(false)} onDeel={handleDeel} />}
    </div>
  );
}

// ─── Publieke uploadpagina (werkgever, geen account) ──────────────────────────
function PubliekeUploadPagina() {
  const [bestanden, setBestanden] = useState([]);
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [klaar, setKlaar]         = useState(false);
  const fileRef = useRef(null);

  // Mock token-context (in productie: geladen via GET /api/upload/[token])
  const context = {
    kantoor:   "Pensioenadvies Menkhorst B.V.",
    adviseur:  "D. Wietzema Menkhorst",
    klant:     "Oranje Techniek B.V.",
    aanvrager: "J. de Vries",
    resterend: 8,
    verlopen:  false,
  };

  const voegToe = (files) => {
    const nieuw = Array.from(files).map(f => ({ id:Date.now()+Math.random(), bestand:f, status:"wachten" }));
    setBestanden(p => [...p, ...nieuw]);
  };

  const verwijder = (id) => setBestanden(p => p.filter(b => b.id !== id));

  const upload = async () => {
    setUploading(true);
    await new Promise(r => setTimeout(r, 1800));
    setBestanden(p => p.map(b => ({ ...b, status:"geupload" })));
    setUploading(false);
    setKlaar(true);
  };

  if (context.verlopen) return (
    <div style={{ maxWidth:520, margin:"80px auto", padding:24, textAlign:"center", fontFamily:T.font }}>
      <div style={{ fontSize:36, marginBottom:12 }}>⏱</div>
      <h2 style={{ color:T.text, marginBottom:8 }}>Upload-link verlopen</h2>
      <p style={{ color:T.textSec }}>Deze link is niet meer geldig. Neem contact op met {context.adviseur} voor een nieuwe link.</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:T.font }}>
      {/* Header */}
      <div style={{ background:T.bgCard, borderBottom:`1px solid ${T.border}`, padding:"16px 24px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:T.accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🔒</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Beveiligde documentupload</div>
          <div style={{ fontSize:11, color:T.textSec }}>{context.kantoor}</div>
        </div>
      </div>

      <div style={{ maxWidth:560, margin:"0 auto", padding:"32px 24px" }}>
        {klaar ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <h2 style={{ color:T.text, marginBottom:8, fontFamily:T.font }}>Documenten ontvangen</h2>
            <p style={{ color:T.textSec, fontFamily:T.font }}>
              {context.adviseur} heeft uw {bestanden.length} bestand{bestanden.length>1?"en":""} ontvangen en wordt automatisch op de hoogte gebracht. U ontvangt een bevestiging per e-mail.
            </p>
            <div style={{ marginTop:20, padding:"12px 16px", background:T.bgSec, borderRadius:9, fontSize:12, color:T.textTer }}>
              Uw bestanden zijn versleuteld opgeslagen en uitsluitend toegankelijk voor {context.adviseur}.
            </div>
          </div>
        ) : (
          <>
            {/* Context */}
            <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>Upload-verzoek van {context.adviseur}</div>
              {[["Voor", context.klant], ["Aangevraagd door", context.aanvrager], ["Resterend", `${context.resterend} van 10 uploads beschikbaar`]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", gap:10, padding:"3px 0" }}>
                  <span style={{ fontSize:11, color:T.textTer, width:130, flexShrink:0 }}>{l}</span>
                  <span style={{ fontSize:12, color:T.text, fontFamily:T.mono }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);voegToe(e.dataTransfer.files);}}
              onClick={()=>fileRef.current?.click()}
              style={{ border:`2px dashed ${dragOver?T.accent:T.border}`, borderRadius:12, padding:"32px 20px", textAlign:"center", cursor:"pointer", background:dragOver?T.accentBg:T.bgSec, marginBottom:14, transition:"all .15s" }}>
              <input ref={fileRef} type="file" multiple style={{ display:"none" }} onChange={e=>voegToe(e.target.files)} />
              <div style={{ fontSize:32, marginBottom:10 }}>📂</div>
              <div style={{ fontSize:14, fontWeight:600, color:T.text }}>Sleep bestanden hierheen</div>
              <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>of klik om te bladeren · PDF, Word, Excel · max. 25 MB per bestand</div>
            </div>

            {/* Bestanden lijst */}
            {bestanden.length > 0 && (
              <div style={{ marginBottom:16 }}>
                {bestanden.map(b => (
                  <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:8, marginBottom:6 }}>
                    <span style={{ fontSize:18 }}>📄</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.bestand.name}</div>
                      <div style={{ fontSize:10, color:T.textTer }}>{kb(b.bestand.size)}</div>
                    </div>
                    {b.status === "geupload"
                      ? <span style={{ fontSize:12, color:T.accent }}>✓</span>
                      : <button onClick={()=>verwijder(b.id)} style={{ background:"none", border:"none", color:T.textTer, cursor:"pointer", fontSize:16 }}>×</button>}
                  </div>
                ))}
              </div>
            )}

            {bestanden.length > 0 && (
              <button onClick={upload} disabled={uploading}
                style={{ width:"100%", padding:13, borderRadius:10, border:"none", background:uploading?T.border:T.accent, color:"#fff", fontSize:14, fontWeight:600, cursor:uploading?"not-allowed":"pointer", fontFamily:T.font }}>
                {uploading ? "Uploaden…" : `${bestanden.length} bestand${bestanden.length>1?"en":""} veilig uploaden`}
              </button>
            )}

            <div style={{ marginTop:16, padding:"10px 13px", background:T.bgSec, borderRadius:8, fontSize:11, color:T.textTer, textAlign:"center" }}>
              🔒 Bestanden worden versleuteld verstuurd en opgeslagen. Alleen {context.adviseur} heeft toegang.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Publieke downloadpagina ───────────────────────────────────────────────────
function PubliekeDownloadPagina() {
  const [naam, setNaam]     = useState("");
  const [stap, setStap]     = useState("verificatie"); // verificatie | klaar | verlopen
  const [downloading, setDownloading] = useState(false);

  // Mock token-context
  const context = {
    kantoor:    "Pensioenadvies Menkhorst B.V.",
    adviseur:   "D. Wietzema Menkhorst",
    document:   "Adviesrapport Q1 2026 — Oranje Techniek B.V.",
    categorie:  "Adviesrapport",
    grootte:    "245 KB",
    geldig_tot: "27 april 2026",
    verlopen:   false,
    downloads_resterend: 4,
  };

  const bevestig = async () => {
    if (!naam.trim()) return;
    setDownloading(true);
    await new Promise(r => setTimeout(r, 1200));
    setDownloading(false);
    setStap("klaar");
  };

  if (context.verlopen) return (
    <div style={{ maxWidth:480, margin:"80px auto", padding:24, textAlign:"center", fontFamily:T.font }}>
      <div style={{ fontSize:36, marginBottom:12 }}>⏱</div>
      <h2 style={{ color:T.text }}>Download-link verlopen</h2>
      <p style={{ color:T.textSec }}>Neem contact op met {context.adviseur} voor een nieuwe link.</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:T.font }}>
      <div style={{ background:T.bgCard, borderBottom:`1px solid ${T.border}`, padding:"16px 24px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:T.accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🔒</div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Beveiligde documentdownload</div>
          <div style={{ fontSize:11, color:T.textSec }}>{context.kantoor}</div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"40px 24px" }}>

        {stap === "verificatie" && (
          <>
            <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"16px 18px", marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:10 }}>📄 {context.document}</div>
              {[["Type", context.categorie], ["Grootte", context.grootte], ["Geldig tot", context.geldig_tot], ["Downloads resterend", `${context.downloads_resterend} van 5`]].map(([l,v])=>(
                <div key={l} style={{ display:"flex", gap:10, padding:"3px 0" }}>
                  <span style={{ fontSize:11, color:T.textTer, width:150, flexShrink:0 }}>{l}</span>
                  <span style={{ fontSize:12, color:T.text }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:T.warnBg, border:`0.5px solid ${T.warn}44`, borderRadius:10, padding:"11px 14px", marginBottom:20, fontSize:12, color:T.warnText }}>
              ⚠ Dit document is vertrouwelijk en uitsluitend bestemd voor de geadresseerde. Bevestig uw identiteit voor u het document downloadt.
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", display:"block", marginBottom:6 }}>Uw naam (voor audittrail)</label>
              <input value={naam} onChange={e=>setNaam(e.target.value)} placeholder="Volledige naam"
                style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.bgSec, outline:"none", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border} />
            </div>

            <button onClick={bevestig} disabled={!naam.trim() || downloading}
              style={{ width:"100%", padding:13, borderRadius:10, border:"none", background:(naam.trim()&&!downloading)?T.accent:T.border, color:"#fff", fontSize:14, fontWeight:600, cursor:(naam.trim()&&!downloading)?"pointer":"not-allowed" }}>
              {downloading ? "Bezig…" : "Identiteit bevestigen & downloaden"}
            </button>

            <div style={{ marginTop:14, fontSize:11, color:T.textTer, textAlign:"center" }}>
              🔒 Uw naam en downloadtijdstip worden geregistreerd voor compliance-doeleinden.
            </div>
          </>
        )}

        {stap === "klaar" && (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <h2 style={{ color:T.text, marginBottom:8 }}>Download gestart</h2>
            <p style={{ color:T.textSec, marginBottom:20 }}>
              Bedankt, {naam}. Het document <strong>{context.document}</strong> wordt gedownload.
            </p>
            <div style={{ padding:"12px 16px", background:T.bgSec, borderRadius:9, fontSize:12, color:T.textTer }}>
              Uw download is geregistreerd op {new Date().toLocaleString("nl-NL")}. {context.adviseur} wordt op de hoogte gesteld.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root: demo-navigator ─────────────────────────────────────────────────────
export default function DocumentuitwisselingDemo() {
  const [view, setView] = useState("adviseur");

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:"100vh" }}>
      {/* Demo nav */}
      <div style={{ background:"#1a1a18", padding:"10px 20px", display:"flex", gap:8, alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#666", marginRight:8, fontFamily:T.font }}>Demo view:</span>
        {[["adviseur","👔 Adviseur-dashboard"],["werkgever","📂 Werkgever upload"],["werknemer","📥 Werknemer download"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)}
            style={{ padding:"5px 12px", borderRadius:6, border:"none", background:view===k?"#1d9e75":"#333", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:T.font }}>
            {l}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === "adviseur" && (
        <div style={{ maxWidth:940, margin:"0 auto", padding:24 }}>
          <AdviseurDocumenten />
        </div>
      )}
      {view === "werkgever" && <PubliekeUploadPagina />}
      {view === "werknemer" && <PubliekeDownloadPagina />}
    </div>
  );
}
