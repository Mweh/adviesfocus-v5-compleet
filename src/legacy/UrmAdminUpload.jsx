import { useState, useRef } from "react";

const T = {
  bg:"#f7f6f3", bgCard:"#ffffff", bgSec:"#f1efe8",
  border:"rgba(15,15,14,0.10)", borderSec:"rgba(15,15,14,0.06)",
  text:"#0f0f0e", textSec:"rgba(15,15,14,0.55)", textTer:"rgba(15,15,14,0.38)",
  accent:"#1d9e75", accentBg:"#e0f2ee",
  warn:"#ef9f27", warnBg:"#faeeda", warnText:"#854f0b",
  danger:"#e24b4a", dangerBg:"#fcebeb", dangerText:"#a32d2d",
  blue:"#185fa5", blueBg:"#e6f1fb",
  font:"'DM Sans', system-ui, sans-serif",
  mono:"'DM Mono', monospace",
};

// ─── Mock bestaande sets ───────────────────────────────────────────────────────
const BESTAANDE_SETS = [
  { kwartaal:"2026Q1", aangemaakt_op:"2026-01-15", n_scenarios:20000, actief:true,  bronbestand:"CP2022 P scenarioset 20K 2026Q1.xlsx" },
  { kwartaal:"2025Q4", aangemaakt_op:"2025-10-14", n_scenarios:20000, actief:false, bronbestand:"CP2022 P scenarioset 20K 2025Q4.xlsx" },
  { kwartaal:"2025Q3", aangemaakt_op:"2025-07-15", n_scenarios:20000, actief:false, bronbestand:"CP2022 P scenarioset 20K 2025Q3.xlsx" },
  { kwartaal:"2025Q2", aangemaakt_op:"2025-04-17", n_scenarios:20000, actief:false, bronbestand:"CP2022 P scenarioset 20K 2025Q2.xlsx" },
];

function Badge({ label, color, bg }) {
  return <span style={{ fontSize:10, fontWeight:600, color, background:bg, padding:"2px 8px", borderRadius:99, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</span>;
}

function StapBadge({ nr, label, actief, klaar }) {
  const kleur = klaar ? T.accent : actief ? T.blue : T.textTer;
  const bg    = klaar ? T.accentBg : actief ? T.blueBg : T.bgSec;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:24, height:24, borderRadius:"50%", background:bg, color:kleur, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, fontFamily:T.mono, flexShrink:0 }}>
        {klaar ? "✓" : nr}
      </div>
      <span style={{ fontSize:12, fontWeight: actief||klaar ? 600 : 400, color:kleur, fontFamily:T.font }}>{label}</span>
    </div>
  );
}

export default function URMUploadAdmin() {
  const [fase, setFase]         = useState("overzicht"); // overzicht | upload | validatie | bevestiging | klaar
  const [dragOver, setDragOver] = useState(false);
  const [bestand, setBestand]   = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [uploadVoortgang, setUploadVoortgang] = useState(0);
  const [uploadStatus, setUploadStatus]       = useState("idle"); // idle | uploading | klaar | fout
  const [foutmelding, setFoutmelding]         = useState("");
  const fileRef = useRef(null);

  // ── JSON inlezen en valideren ──────────────────────────────────────────────
  function verwerkJSON(file) {
    setBestand(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Valideer structuur
        if (!data.meta || !data.lookup) throw new Error("Ongeldig formaat: 'meta' of 'lookup' ontbreekt.");
        if (!data.meta.kwartaal)        throw new Error("meta.kwartaal ontbreekt.");
        if (!Array.isArray(data.lookup) || data.lookup.length === 0)
          throw new Error("lookup array is leeg.");

        const vereist = ["leeftijd","equity_pct","horizon","p5_factor","p50_factor","p95_factor"];
        const eersteRij = data.lookup[0];
        const ontbrekend = vereist.filter(k => !(k in eersteRij));
        if (ontbrekend.length) throw new Error(`Ontbrekende velden in lookup: ${ontbrekend.join(", ")}`);

        // Controleer of kwartaal al bestaat
        const bestaatAl = BESTAANDE_SETS.find(s => s.kwartaal === data.meta.kwartaal);
        if (bestaatAl) {
          setFoutmelding(`Kwartaal ${data.meta.kwartaal} is al geïmporteerd. Verwijder de bestaande set eerst als u wilt overschrijven.`);
          setFase("fout");
          return;
        }

        setJsonData(data);
        setFoutmelding("");
        setFase("validatie");
      } catch (err) {
        setFoutmelding(err.message);
        setFase("fout");
      }
    };
    reader.readAsText(file);
  }

  // ── Simuleer upload ────────────────────────────────────────────────────────
  async function startUpload() {
    setFase("uploading");
    setUploadStatus("uploading");
    setUploadVoortgang(0);

    // Simuleer batch-upload (echt: POST /api/urm/upload)
    const stappen = [
      { label:"Scenarioset metadata aanmaken…", pct:10 },
      { label:"Lookup-rijen uploaden (batch 1/10)…", pct:25 },
      { label:"Lookup-rijen uploaden (batch 3/10)…", pct:40 },
      { label:"Lookup-rijen uploaden (batch 5/10)…", pct:55 },
      { label:"Lookup-rijen uploaden (batch 7/10)…", pct:70 },
      { label:"Lookup-rijen uploaden (batch 9/10)…", pct:85 },
      { label:"Scenarioset activeren…", pct:95 },
      { label:"Verificatie…", pct:100 },
    ];

    for (const stap of stappen) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
      setUploadVoortgang(stap.pct);
    }

    setUploadStatus("klaar");
    setFase("klaar");
  }

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:T.font, maxWidth:760, margin:"0 auto", padding:24, background:T.bg, minHeight:"100vh" }}>

      {/* Laad fonts */}
      {typeof document !== "undefined" && !document.getElementById("af-font") && (() => {
        const l = document.createElement("link"); l.id="af-font"; l.rel="stylesheet";
        l.href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
        document.head.appendChild(l); return null;
      })()}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:T.blueBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📡</div>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:T.text, fontFamily:T.font }}>URM Scenarioset beheer</h2>
            <p style={{ margin:0, fontSize:12, color:T.textSec }}>Beheer de kwartaallijkse DNB P-scenariosets voor URM-berekeningen in module 2.3</p>
          </div>
        </div>

        {/* Stappen indicator */}
        <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"12px 16px", marginTop:14, display:"flex", gap:20, flexWrap:"wrap" }}>
          <StapBadge nr="1" label="Overzicht"    actief={fase==="overzicht"}  klaar={["upload","validatie","uploading","klaar"].includes(fase)} />
          <span style={{ color:T.borderSec, alignSelf:"center" }}>→</span>
          <StapBadge nr="2" label="JSON uploaden" actief={fase==="upload"}     klaar={["validatie","uploading","klaar"].includes(fase)} />
          <span style={{ color:T.borderSec, alignSelf:"center" }}>→</span>
          <StapBadge nr="3" label="Validatie"     actief={fase==="validatie"}  klaar={["uploading","klaar"].includes(fase)} />
          <span style={{ color:T.borderSec, alignSelf:"center" }}>→</span>
          <StapBadge nr="4" label="Importeren"    actief={fase==="uploading"}  klaar={fase==="klaar"} />
        </div>
      </div>

      {/* ── OVERZICHT ─────────────────────────────────────────────────────── */}
      {fase === "overzicht" && (
        <div>
          <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, marginBottom:16, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`0.5px solid ${T.borderSec}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font }}>Geïmporteerde scenariosets</div>
              <Badge label="DNB kwartaalsets" color={T.blue} bg={T.blueBg} />
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:T.bgSec }}>
                  {["Kwartaal","Aangemaakt","Scenario's","Status","Bronbestand",""].map(h => (
                    <th key={h} style={{ padding:"7px 12px", textAlign:"left", fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", fontFamily:T.font, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BESTAANDE_SETS.map((s, i) => (
                  <tr key={s.kwartaal} style={{ background:i%2===0?T.bgCard:T.bgSec }}>
                    <td style={{ padding:"8px 12px", fontSize:13, fontWeight:700, fontFamily:T.mono, color:T.text }}>{s.kwartaal}</td>
                    <td style={{ padding:"8px 12px", fontSize:12, fontFamily:T.font, color:T.textSec }}>{s.aangemaakt_op}</td>
                    <td style={{ padding:"8px 12px", fontSize:12, fontFamily:T.mono, color:T.textSec }}>{s.n_scenarios.toLocaleString("nl-NL")}</td>
                    <td style={{ padding:"8px 12px" }}>
                      {s.actief
                        ? <Badge label="Actief" color={T.accent} bg={T.accentBg} />
                        : <Badge label="Archief" color={T.textTer} bg={T.bgSec} />}
                    </td>
                    <td style={{ padding:"8px 12px", fontSize:10, fontFamily:T.mono, color:T.textTer, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.bronbestand}</td>
                    <td style={{ padding:"8px 12px" }}>
                      {!s.actief && (
                        <button style={{ fontSize:11, color:T.blue, background:"none", border:"none", cursor:"pointer", fontFamily:T.font }}>
                          Activeren
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Workflow uitleg */}
          <div style={{ background:T.bgSec, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8, fontFamily:T.font }}>📋 Kwartaalworkflow</div>
            {[
              ["1", "Download het extractiescript", "dnb_urm_extract.py", "staat in de repository onder /scripts/urm/"],
              ["2", "Download de nieuwe DNB P-scenarioset", "dnb.nl → Open Boek Toezicht → Pensioenfondsen → Scenariosets", "kies de 20K XLSX variant (~171 MB)"],
              ["3", "Draai het script", "python dnb_urm_extract.py --input \"CP2022 P scenarioset 20K 2026Q2.xlsx\" --kwartaal 2026Q2", "duurt 10-20 min, output is ~50 KB JSON"],
              ["4", "Upload het JSON-bestand hier", "→ knop hieronder", "de set wordt automatisch geactiveerd"],
            ].map(([nr, label, code, sub]) => (
              <div key={nr} style={{ display:"flex", gap:10, marginBottom:10 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:T.bgCard, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, fontFamily:T.mono, flexShrink:0, marginTop:1 }}>{nr}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:T.text, fontFamily:T.font }}>{label}</div>
                  <div style={{ fontSize:11, fontFamily:T.mono, color:T.blue, background:T.blueBg, padding:"2px 7px", borderRadius:5, marginTop:3, display:"inline-block" }}>{code}</div>
                  <div style={{ fontSize:11, color:T.textTer, marginTop:2, fontFamily:T.font }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setFase("upload")}
            style={{ width:"100%", padding:13, borderRadius:10, background:T.accent, color:"#fff", border:"none", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:T.font, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 11V3M4 6l4-4 4 4M2 13h12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Nieuwe scenarioset uploaden (2026Q2)
          </button>
        </div>
      )}

      {/* ── UPLOAD ────────────────────────────────────────────────────────── */}
      {fase === "upload" && (
        <div>
          <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4, fontFamily:T.font }}>JSON-bestand uploaden</div>
            <div style={{ fontSize:12, color:T.textSec, marginBottom:16, fontFamily:T.font }}>
              Upload het JSON-bestand dat is gegenereerd door <code style={{ fontFamily:T.mono, fontSize:11, background:T.bgSec, padding:"1px 5px", borderRadius:4 }}>dnb_urm_extract.py</code>.
              Niet de originele DNB Excel — die is te groot voor de browser.
            </div>
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);verwerkJSON(e.dataTransfer.files[0]);}}
              onClick={()=>fileRef.current?.click()}
              style={{ border:`2px dashed ${dragOver?T.accent:T.border}`, borderRadius:12, padding:"32px 20px", textAlign:"center", cursor:"pointer", background:dragOver?T.accentBg:T.bgSec, transition:"all .15s" }}>
              <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={e=>verwerkJSON(e.target.files[0])}/>
              <div style={{ fontSize:28, marginBottom:8 }}>📄</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font, marginBottom:3 }}>Sleep het JSON-bestand hierheen</div>
              <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font }}>urm_lookup_2026Q2.json · gegenereerd door dnb_urm_extract.py</div>
            </div>
          </div>
          <button onClick={()=>setFase("overzicht")} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:12, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>← Terug</button>
        </div>
      )}

      {/* ── FOUT ──────────────────────────────────────────────────────────── */}
      {fase === "fout" && (
        <div>
          <div style={{ background:T.dangerBg, border:`1px solid ${T.danger}44`, borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:600, color:T.dangerText, marginBottom:6, fontFamily:T.font }}>⚠ Validatiefout</div>
            <div style={{ fontSize:13, color:T.dangerText, fontFamily:T.mono }}>{foutmelding}</div>
          </div>
          <button onClick={()=>setFase("upload")} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:12, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>← Ander bestand proberen</button>
        </div>
      )}

      {/* ── VALIDATIE ─────────────────────────────────────────────────────── */}
      {fase === "validatie" && jsonData && (
        <div>
          <div style={{ background:T.accentBg, border:`1px solid ${T.accent}44`, borderRadius:12, padding:"14px 16px", marginBottom:14, display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:20 }}>✓</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:T.accent, fontFamily:T.font }}>JSON succesvol gelezen en gevalideerd</div>
              <div style={{ fontSize:12, color:T.accent, fontFamily:T.font }}>Kwartaal {jsonData.meta.kwartaal} — {jsonData.lookup.length} lookup-rijen</div>
            </div>
          </div>

          {/* Metadata */}
          <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:10, fontFamily:T.font }}>Metadata verificatie</div>
            {[
              ["Kwartaal",              jsonData.meta.kwartaal],
              ["Aangemaakt op",         new Date(jsonData.meta.aangemaakt_op).toLocaleString("nl-NL")],
              ["Aantal scenario's",     jsonData.meta.n_scenarios.toLocaleString("nl-NL")],
              ["Simulatiehorizon",      `${jsonData.meta.n_jaren} jaar`],
              ["Kostencorrectie",       `${jsonData.meta.kostenafslag_bps} basispunten`],
              ["Bronbestand",           jsonData.meta.bronbestand],
              ["Lookup-rijen",          jsonData.lookup.length.toLocaleString("nl-NL")],
              ["P-percentiel pess.",    `P${jsonData.meta.percentiel_pessimistisch}`],
              ["P-percentiel verw.",    `P${jsonData.meta.percentiel_verwacht}`],
              ["P-percentiel opt.",     `P${jsonData.meta.percentiel_optimistisch}`],
            ].map(([l,v]) => (
              <div key={l} style={{ display:"flex", padding:"5px 0", borderBottom:`0.5px solid ${T.borderSec}` }}>
                <span style={{ fontSize:11, color:T.textTer, width:180, flexShrink:0, fontFamily:T.font }}>{l}</span>
                <span style={{ fontSize:12, color:T.text, fontFamily:T.mono }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Steekproef */}
          <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:10, fontFamily:T.font }}>Steekproef — leeftijd 45, equity 60%</div>
            {(() => {
              const rij = jsonData.lookup.find(r => r.leeftijd===45 && r.equity_pct===60);
              if (!rij) return <div style={{ fontSize:12, color:T.textTer, fontFamily:T.font }}>Combinatie niet gevonden</div>;
              const inleg = 10000;
              const maand = (k) => {
                const r=0.02/12,n=240; return k*(r*(1+r)**n)/((1+r)**n-1);
              };
              return [
                ["Pessimistisch (P5)",  rij.p5_factor],
                ["Verwacht (P50)",      rij.p50_factor],
                ["Optimistisch (P95)",  rij.p95_factor],
              ].map(([l,f]) => {
                const kap = inleg*f;
                const mnd = maand(kap);
                return (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`0.5px solid ${T.borderSec}` }}>
                    <span style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>{l}</span>
                    <span style={{ fontSize:12, fontFamily:T.mono, color:T.text }}>
                      factor {f.toFixed(2)} → €{kap.toLocaleString("nl-NL",{maximumFractionDigits:0})} eindkap. → <strong>€{mnd.toLocaleString("nl-NL",{maximumFractionDigits:0})}/mnd</strong>
                    </span>
                  </div>
                );
              });
            })()}
            <div style={{ fontSize:10, color:T.textTer, marginTop:6, fontFamily:T.font }}>Berekend bij €10.000/jr inleg, annuïteit 20 jaar @ 2%</div>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setFase("upload")} style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:13, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>← Terug</button>
            <button onClick={startUpload} style={{ flex:1, padding:"9px 20px", borderRadius:8, border:"none", background:T.accent, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:T.font, display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
              Importeren en activeren — {jsonData.meta.kwartaal}
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── UPLOADING ─────────────────────────────────────────────────────── */}
      {fase === "uploading" && (
        <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"32px 24px", textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:16 }}>⏳</div>
          <div style={{ fontSize:15, fontWeight:600, color:T.text, marginBottom:6, fontFamily:T.font }}>Importeren naar Supabase…</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:20, fontFamily:T.font }}>Lookup-rijen worden in batches opgeslaan</div>
          <div style={{ background:T.bgSec, borderRadius:99, height:8, overflow:"hidden", marginBottom:10 }}>
            <div style={{ width:`${uploadVoortgang}%`, height:"100%", background:T.accent, borderRadius:99, transition:"width .4s ease" }}/>
          </div>
          <div style={{ fontSize:12, fontFamily:T.mono, color:T.textSec }}>{uploadVoortgang}%</div>
        </div>
      )}

      {/* ── KLAAR ─────────────────────────────────────────────────────────── */}
      {fase === "klaar" && (
        <div>
          <div style={{ background:T.accentBg, border:`1px solid ${T.accent}44`, borderRadius:12, padding:"24px", textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
            <div style={{ fontSize:16, fontWeight:700, color:T.accent, marginBottom:4, fontFamily:T.font }}>Scenarioset succesvol geïmporteerd</div>
            <div style={{ fontSize:13, color:T.accent, fontFamily:T.font }}>
              {jsonData?.meta?.kwartaal} is nu actief — module 2.3 gebruikt vanaf nu de nieuwe DNB-percentielwaarden.
            </div>
          </div>
          <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8, fontFamily:T.font }}>Volgende actie</div>
            <div style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>
              Sla de datum van de volgende DNB-publicatie op in je agenda:<br/>
              <strong>2026Q2 → verwacht rond 15 april 2026</strong><br/>
              Download dan de nieuwe Excel en herhaal dit proces.
            </div>
          </div>
          <button onClick={()=>setFase("overzicht")} style={{ width:"100%", padding:12, borderRadius:9, background:T.accent, color:"#fff", border:"none", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:T.font }}>
            Terug naar overzicht
          </button>
        </div>
      )}
    </div>
  );
}
