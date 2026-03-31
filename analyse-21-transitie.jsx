import { useState, useMemo, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

// ─── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg: "#f7f6f3", bgCard: "#ffffff", bgSec: "#f1efe8",
  border: "rgba(15,15,14,0.10)", borderSec: "rgba(15,15,14,0.06)",
  text: "#0f0f0e", textSec: "rgba(15,15,14,0.55)", textTer: "rgba(15,15,14,0.38)",
  accent: "#1d9e75", accentBg: "#e0f2ee",
  warn: "#ef9f27", warnBg: "#faeeda", warnText: "#854f0b",
  danger: "#e24b4a", dangerBg: "#fcebeb", dangerText: "#a32d2d",
  blue: "#185fa5", blueBg: "#e6f1fb",
  font: "'DM Sans', system-ui, sans-serif",
  mono: "'DM Mono', monospace",
};

// ─── Getalnotatie (NL) ────────────────────────────────────────────────────────
const eur = (n) =>
  new Intl.NumberFormat("nl-NL", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(n ?? 0);

function eurCompact(n) {
  const v = n ?? 0;
  if (v >= 1_000_000) return `€\u00a0${(v / 1_000_000).toLocaleString("nl-NL", { minimumFractionDigits:1, maximumFractionDigits:2 })}\u00a0mln`;
  if (v >= 1_000)     return `€\u00a0${(v / 1_000).toLocaleString("nl-NL", { minimumFractionDigits:0, maximumFractionDigits:1 })}\u00a0k`;
  return eur(v);
}

// Voor Y-as labels in grafiek (kort)
function eurAs(n) {
  if (n >= 1_000_000) return `${(n/1_000_000).toLocaleString("nl-NL", {maximumFractionDigits:1})} mln`;
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}k`;
  return `${n}`;
}

// ─── Rekenkern ────────────────────────────────────────────────────────────────
function staffelPremie(leeftijd) {
  if (leeftijd < 25) return 0.054;
  if (leeftijd < 30) return 0.068;
  if (leeftijd < 35) return 0.087;
  if (leeftijd < 40) return 0.110;
  if (leeftijd < 45) return 0.139;
  if (leeftijd < 50) return 0.176;
  if (leeftijd < 55) return 0.222;
  if (leeftijd < 60) return 0.280;
  return 0.322;
}

const AOW_LEEFTIJD = 67;
const RENTE = 0.04;

function berekenWerknemer(w, franchise, vlakkePremiePerc, compensatieFactor) {
  const grondslag = Math.max(0, w.salaris - franchise) * (w.parttimePerc / 100);
  const restJaren = Math.max(0, AOW_LEEFTIJD - w.leeftijd);
  const inlegOud  = grondslag * staffelPremie(w.leeftijd);
  const inlegNieuw = grondslag * (vlakkePremiePerc / 100);
  const fvFactor  = restJaren > 0 ? ((Math.pow(1 + RENTE, restJaren) - 1) / RENTE) : 1;
  const kapitaalOud  = inlegOud * fvFactor;
  const kapitaalNieuw = inlegNieuw * fvFactor;
  const verschilInleg = inlegNieuw - inlegOud;
  const compensatieJaar  = Math.max(0, -verschilInleg) * compensatieFactor;
  const compensatieTotaal = compensatieJaar * restJaren;
  return { ...w, grondslag, inlegOud, inlegNieuw, verschilInleg, kapitaalOud, kapitaalNieuw, compensatieJaar, compensatieTotaal, restJaren };
}

// ─── CSV import helpers ───────────────────────────────────────────────────────
const CSV_KOLOMMEN = ["naam","geboortejaar","salaris","parttime_perc","dienstjaren"];

const CSV_TEMPLATE_INHOUD = `naam,geboortejaar,salaris,parttime_perc,dienstjaren
A. de Vries,1978,58000,100,18
B. Janssen,1985,44500,80,12
C. Peters,1991,37200,100,7
D. Bakker,1969,72000,100,28
E. Visser,1995,31000,60,4`;

const CSV_UITLEG = {
  naam:         "Volledige naam (tekst)",
  geboortejaar: "Viercijferig jaar, bijv. 1982",
  salaris:      "Bruto jaarsalaris in €, bijv. 52000",
  parttime_perc:"Arbeidsomvang in %, bijv. 100 of 80",
  dienstjaren:  "Aantal jaren in dienst, bijv. 12",
};

function parseCSV(tekst) {
  const regels = tekst.trim().split(/\r?\n/).filter(r => r.trim());
  if (regels.length < 2) throw new Error("Bestand bevat geen datarijen.");
  const header = regels[0].split(",").map(h => h.trim().toLowerCase());

  // Check verplichte kolommen
  const ontbrekend = CSV_KOLOMMEN.filter(k => !header.includes(k));
  if (ontbrekend.length) throw new Error(`Ontbrekende kolommen: ${ontbrekend.join(", ")}`);

  const idx = (k) => header.indexOf(k);
  const fouten = [];
  const werknemers = [];

  regels.slice(1).forEach((regel, i) => {
    const velden = regel.split(",").map(v => v.trim());
    const rijnr = i + 2;
    const naam = velden[idx("naam")];
    const geboortejaar = parseInt(velden[idx("geboortejaar")]);
    const salaris      = parseFloat(velden[idx("salaris")]);
    const parttimePerc = parseFloat(velden[idx("parttime_perc")]);
    const dienstjaren  = parseInt(velden[idx("dienstjaren")]);
    const leeftijd     = new Date().getFullYear() - geboortejaar;

    if (!naam)                          fouten.push(`Rij ${rijnr}: naam ontbreekt`);
    if (isNaN(geboortejaar) || geboortejaar < 1940 || geboortejaar > 2005)
                                        fouten.push(`Rij ${rijnr}: ongeldig geboortejaar (${velden[idx("geboortejaar")]})`);
    if (isNaN(salaris) || salaris < 5000) fouten.push(`Rij ${rijnr}: ongeldig salaris`);
    if (isNaN(parttimePerc) || parttimePerc < 10 || parttimePerc > 100)
                                        fouten.push(`Rij ${rijnr}: ongeldige parttime% (${velden[idx("parttime_perc")]})`);
    if (isNaN(dienstjaren) || dienstjaren < 0) fouten.push(`Rij ${rijnr}: ongeldige dienstjaren`);

    if (naam && !isNaN(salaris) && !isNaN(parttimePerc)) {
      werknemers.push({ id: i + 1, naam, leeftijd: isNaN(leeftijd) ? 40 : leeftijd, salaris, parttimePerc, dienstjaren: isNaN(dienstjaren) ? 0 : dienstjaren, geboortejaar });
    }
  });

  return { werknemers, fouten };
}

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE_INHOUD], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "werknemers_template_adviesfocus.csv";
  a.click(); URL.revokeObjectURL(url);
}

// ─── Mock data (fallback) ─────────────────────────────────────────────────────
function maakMockWerknemers() {
  const namen = ["A. de Vries","B. Janssen","C. Peters","D. Bakker","E. Visser",
    "F. de Boer","G. Meijer","H. van Dijk","I. Smit","J. Mulder",
    "K. de Graaf","L. Hendriks","M. Vermeer","N. van den Berg","O. Jacobs",
    "P. Koster","Q. Brouwer","R. Lammers","S. van Leeuwen","T. de Wit",
    "U. Willems","V. Driessen","W. Hoekstra","X. van der Meer","Y. Bosman",
    "Z. Tijssen","AA. Dekker","BB. Verhoeven","CC. Kuijpers","DD. van Heel",
    "EE. Bos","FF. Prins","GG. Gerritsen","HH. Vogel","II. Schäfer",
    "JJ. Huisman","KK. Peeters","LL. Bijlsma","MM. Franken","NN. Westra",
    "OO. Gerrits","PP. Konings","QQ. van Zanten","RR. Mol","SS. Spijker"];
  return namen.map((naam, i) => ({
    id: i + 1, naam,
    leeftijd:    22 + Math.floor(Math.abs(Math.sin(i * 7.3) * 40)),
    salaris:     28000 + Math.floor(Math.abs(Math.sin(i * 3.7) * 72000)),
    parttimePerc: [100,100,100,80,60][i % 5],
    dienstjaren: Math.max(1, 3 + (i % 20)),
  }));
}

const MOCK_WERKNEMERS = maakMockWerknemers();

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
function Pill({ color, bg, children }) {
  return <span style={{ fontSize:11, fontWeight:500, color, background:bg, padding:"2px 8px", borderRadius:99, fontFamily:T.font }}>{children}</span>;
}

function KpiCard({ label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg || T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"12px 14px" }}>
      <div style={{ fontSize:10, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", marginBottom:4, fontFamily:T.font }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color: color || T.text, fontFamily:T.mono, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:3, fontFamily:T.font }}>{sub}</div>}
    </div>
  );
}

function SortHeader({ label, col, sortCol, sortDir, onSort, align="left" }) {
  const active = sortCol === col;
  return (
    <th onClick={() => onSort(col)} style={{ padding:"8px 10px", fontSize:11, fontWeight:600,
      color: active?T.text:T.textTer, textAlign:align, cursor:"pointer", userSelect:"none",
      whiteSpace:"nowrap", fontFamily:T.font, textTransform:"uppercase", letterSpacing:".04em",
      background:T.bgSec, borderBottom:`1px solid ${T.border}` }}>
      {label} {active ? (sortDir==="asc"?"↑":"↓") : <span style={{ color:T.borderSec }}>↕</span>}
    </th>
  );
}

function CohortTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 14px", fontSize:12, fontFamily:T.font, boxShadow:"0 4px 12px rgba(0,0,0,.1)" }}>
      <div style={{ fontWeight:600, marginBottom:4, color:T.text }}>Cohort {label}</div>
      <div style={{ color:payload[0].value>0?T.dangerText:T.accent }}>Compensatielast: {eur(payload[0].value)}</div>
      {payload[1] && <div style={{ color:T.textSec }}>{payload[1].value} werknemers</div>}
    </div>
  );
}

// ─── CSV Import modal ─────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport }) {
  const [fase, setFase]           = useState("upload"); // upload | preview | fouten
  const [dragOver, setDragOver]   = useState(false);
  const [preview, setPreview]     = useState([]);
  const [fouten, setFouten]       = useState([]);
  const [bestandsnaam, setBestandsnaam] = useState("");
  const fileRef = useRef(null);

  function verwerkBestand(file) {
    if (!file) return;
    setBestandsnaam(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { werknemers, fouten: f } = parseCSV(e.target.result);
        setPreview(werknemers);
        setFouten(f);
        setFase(f.length > 0 && werknemers.length === 0 ? "fouten" : "preview");
      } catch (err) {
        setFouten([err.message]);
        setFase("fouten");
      }
    };
    reader.readAsText(file);
  }

  const totaleLoonsom = preview.reduce((s, w) => s + w.salaris * (w.parttimePerc / 100), 0);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,15,14,0.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ background:T.bgCard, borderRadius:16, width:620, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.22)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:"22px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <h3 style={{ margin:"0 0 3px", fontSize:16, fontWeight:700, color:T.text, fontFamily:T.font }}>Werknemersbestand importeren</h3>
            <p style={{ margin:0, fontSize:12, color:T.textSec, fontFamily:T.font }}>Upload een CSV of Excel-export uit uw salarisadministratie</p>
          </div>
          <button onClick={onClose} style={{ background:T.bgSec, border:`1px solid ${T.border}`, borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:18, color:T.textTer }}>×</button>
        </div>

        <div style={{ padding:"16px 24px 24px" }}>

          {/* Template download */}
          <div style={{ background:T.bgSec, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:3, fontFamily:T.font }}>📥 AdviesFocus CSV-template</div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:8, fontFamily:T.font }}>
                  Download de template, vul in en upload. Compatibel met exports van Exact, AFAS en Nmbrs.
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {CSV_KOLOMMEN.map(k => (
                    <div key={k} style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:6, padding:"3px 8px" }}>
                      <span style={{ fontSize:11, fontWeight:600, color:T.text, fontFamily:T.mono }}>{k}</span>
                      <span style={{ fontSize:10, color:T.textTer, marginLeft:4, fontFamily:T.font }}>{CSV_UITLEG[k]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={downloadTemplate}
                style={{ flexShrink:0, padding:"8px 14px", borderRadius:8, border:`1px solid ${T.accent}`, background:T.accentBg, color:T.accent, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" }}>
                Download template
              </button>
            </div>
          </div>

          {/* Upload zone */}
          {(fase === "upload" || fase === "fouten") && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); verwerkBestand(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${dragOver ? T.accent : T.border}`, borderRadius:12, padding:"28px 20px", textAlign:"center", cursor:"pointer", background: dragOver ? T.accentBg : T.bgSec, transition:"all .15s" }}>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display:"none" }} onChange={e => verwerkBestand(e.target.files[0])} />
              <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font, marginBottom:3 }}>Sleep een CSV-bestand hierheen</div>
              <div style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>of klik om te bladeren · .csv, .txt</div>
            </div>
          )}

          {/* Foutmelding */}
          {fase === "fouten" && fouten.length > 0 && (
            <div style={{ marginTop:12, background:T.dangerBg, border:`0.5px solid ${T.danger}44`, borderRadius:9, padding:"10px 14px" }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.dangerText, marginBottom:6, fontFamily:T.font }}>⚠ {fouten.length} validatiefout{fouten.length>1?"en":""} gevonden</div>
              {fouten.map((f,i) => <div key={i} style={{ fontSize:11, color:T.dangerText, fontFamily:T.mono, marginBottom:2 }}>{f}</div>)}
              <div style={{ fontSize:11, color:T.dangerText, marginTop:6, fontFamily:T.font }}>Corrigeer het bestand en upload opnieuw.</div>
            </div>
          )}

          {/* Preview */}
          {fase === "preview" && preview.length > 0 && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font }}>
                  Bestand: <span style={{ fontFamily:T.mono, fontWeight:400 }}>{bestandsnaam}</span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <Pill color={T.accent} bg={T.accentBg}>{preview.length} werknemers</Pill>
                  {fouten.length > 0 && <Pill color={T.warnText} bg={T.warnBg}>{fouten.length} waarschuwingen</Pill>}
                </div>
              </div>

              {/* Samenvatting stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:12 }}>
                {[
                  { label:"Werknemers", val:`${preview.length}` },
                  { label:"Gem. leeftijd", val:`${(preview.reduce((s,w)=>s+w.leeftijd,0)/preview.length).toFixed(1)} jr` },
                  { label:"Gem. salaris", val: eurCompact(preview.reduce((s,w)=>s+w.salaris,0)/preview.length) },
                  { label:"Totale loonsom", val: eurCompact(totaleLoonsom) },
                ].map(k => (
                  <div key={k.label} style={{ background:T.bgSec, borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:9, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em", marginBottom:2, fontFamily:T.font }}>{k.label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.text, fontFamily:T.mono }}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* Previewtabel (eerste 8 rijen) */}
              <div style={{ border:`0.5px solid ${T.border}`, borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:T.bgSec }}>
                      {["Naam","Leeftijd","Salaris","Parttime","Dienstjaren"].map(h => (
                        <th key={h} style={{ padding:"6px 10px", fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".04em", textAlign:"left", fontFamily:T.font, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0,8).map((w,i) => (
                      <tr key={w.id} style={{ background: i%2===0 ? T.bgCard : T.bgSec }}>
                        <td style={{ padding:"5px 10px", fontSize:12, fontFamily:T.font, color:T.text }}>{w.naam}</td>
                        <td style={{ padding:"5px 10px", fontSize:12, fontFamily:T.mono, color:T.textSec }}>{w.leeftijd} jr</td>
                        <td style={{ padding:"5px 10px", fontSize:12, fontFamily:T.mono, color:T.textSec }}>{eur(w.salaris)}</td>
                        <td style={{ padding:"5px 10px", fontSize:12, fontFamily:T.mono, color:T.textSec }}>{w.parttimePerc}%</td>
                        <td style={{ padding:"5px 10px", fontSize:12, fontFamily:T.mono, color:T.textSec }}>{w.dienstjaren} jr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 8 && (
                  <div style={{ padding:"6px 10px", background:T.bgSec, fontSize:11, color:T.textTer, fontFamily:T.font, borderTop:`0.5px solid ${T.border}` }}>
                    + {preview.length - 8} werknemers meer
                  </div>
                )}
              </div>

              {/* Waarschuwingen (niet-blokkerende fouten) */}
              {fouten.length > 0 && (
                <div style={{ background:T.warnBg, border:`0.5px solid ${T.warn}44`, borderRadius:8, padding:"9px 12px", marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.warnText, marginBottom:4, fontFamily:T.font }}>{fouten.length} rij{fouten.length>1?"en werden":""} overgeslagen:</div>
                  {fouten.map((f,i) => <div key={i} style={{ fontSize:11, color:T.warnText, fontFamily:T.mono }}>{f}</div>)}
                </div>
              )}

              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button onClick={() => { setFase("upload"); setPreview([]); setFouten([]); }}
                  style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:12, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>
                  Ander bestand
                </button>
                <button onClick={() => { onImport(preview); onClose(); }}
                  style={{ padding:"8px 18px", borderRadius:8, border:"none", background:T.accent, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:T.font }}>
                  {preview.length} werknemers importeren →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Configuratiescherm ───────────────────────────────────────────────────────
function ConfigScherm({ config, setConfig, werknemers, onImportOpen, onBerekenen }) {
  const { franchise, vlakkePremie, compensatieFactor, scenario } = config;
  const totaleLoonsom = werknemers.reduce((s, w) => s + w.salaris * (w.parttimePerc / 100), 0);
  const isMock = werknemers === MOCK_WERKNEMERS;

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ margin:"0 0 4px", fontSize:18, fontWeight:700, color:T.text, fontFamily:T.font }}>WTP-Transitie & Compensatie</h2>
        <p style={{ margin:0, fontSize:13, color:T.textSec }}>Stel de parameters in voor de transitieberekening van Oranje Techniek B.V.</p>
      </div>

      {/* Blok 1: Werknemersdata */}
      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"16px 18px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2, fontFamily:T.font }}>Werknemersbestand</div>
            <div style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>
              {isMock ? "Voorbeelddata — upload uw eigen CSV om te beginnen" : `Geïmporteerd via CSV · ${werknemers.length} werknemers`}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <Pill color={isMock ? T.warnText : T.accent} bg={isMock ? T.warnBg : T.accentBg}>
              {isMock ? "⚠ Voorbeelddata" : `${werknemers.length} werknemers`}
            </Pill>
            <button onClick={onImportOpen}
              style={{ padding:"7px 13px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:T.font, color:T.text, display:"flex", alignItems:"center", gap:5 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3 6l3.5 3.5L10 6M1 11h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              CSV importeren
            </button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 }}>
          {[
            { label:"Aantal werknemers", val:`${werknemers.length}` },
            { label:"Gemiddelde leeftijd", val:`${(werknemers.reduce((s,w)=>s+w.leeftijd,0)/werknemers.length).toFixed(1)} jaar` },
            { label:"Gemiddeld salaris", val: eurCompact(werknemers.reduce((s,w)=>s+w.salaris,0)/werknemers.length) },
            { label:"Totale loonsom", val: eurCompact(totaleLoonsom) },
          ].map(k => (
            <div key={k.label} style={{ background:T.bgSec, borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:T.textTer, textTransform:"uppercase", letterSpacing:".04em", marginBottom:3, fontFamily:T.font }}>{k.label}</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:T.mono, lineHeight:1.2 }}>{k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Blok 2 + 3 zij aan zij */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>

        {/* Blok 2: Huidige regeling */}
        <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"16px 18px" }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2, fontFamily:T.font }}>Huidige regeling</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:14, fontFamily:T.font }}>Nulsituatie — overgenomen uit inventarisatie</div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:500, color:T.textSec, textTransform:"uppercase", letterSpacing:".04em", display:"block", marginBottom:5, fontFamily:T.font }}>Franchise (AOW-drempel)</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.textTer, fontFamily:T.mono }}>€</span>
              <input type="number" value={franchise} onChange={e => setConfig(c=>({...c,franchise:+e.target.value}))}
                style={{ width:"100%", padding:"9px 11px 9px 24px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.mono, color:T.text, background:T.bgCard, outline:"none", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border} />
            </div>
          </div>

          <label style={{ fontSize:11, fontWeight:500, color:T.textSec, textTransform:"uppercase", letterSpacing:".04em", display:"block", marginBottom:8, fontFamily:T.font }}>Staffelpremies</label>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {[[20,0.054],[25,0.068],[30,0.087],[35,0.110],[40,0.139],[45,0.176],[50,0.222],[55,0.280],[60,0.322]].map(([l,p]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:11, color:T.textTer, width:52, flexShrink:0, fontFamily:T.mono }}>{l}–{l+4} jr</span>
                <div style={{ flex:1, height:5, background:T.bgSec, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${p*250}%`, height:"100%", background:`hsl(${20+l*2},70%,52%)`, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:11, fontWeight:600, color:T.text, width:36, textAlign:"right", fontFamily:T.mono }}>{(p*100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blok 3: Nieuwe regeling */}
        <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"16px 18px" }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:2, fontFamily:T.font }}>Nieuwe regeling</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:18, fontFamily:T.font }}>Doelsituatie — ingesteld via Module C inventarisatie</div>

          <div style={{ marginBottom:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
              <label style={{ fontSize:11, fontWeight:500, color:T.textSec, textTransform:"uppercase", letterSpacing:".04em", fontFamily:T.font }}>Vlakke premie</label>
              <span style={{ fontSize:26, fontWeight:700, color:T.accent, fontFamily:T.mono, lineHeight:1 }}>{vlakkePremie}%</span>
            </div>
            <input type="range" min={10} max={30} step={0.5} value={vlakkePremie}
              onChange={e => setConfig(c=>({...c,vlakkePremie:+e.target.value}))}
              style={{ width:"100%", accentColor:T.accent }} />
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textTer, fontFamily:T.font, marginTop:2 }}>
              <span>10% sober</span><span>20% markt</span><span>30% royaal</span>
            </div>
          </div>

          <div style={{ marginBottom:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
              <label style={{ fontSize:11, fontWeight:500, color:T.textSec, textTransform:"uppercase", letterSpacing:".04em", fontFamily:T.font }}>Compensatiefactor</label>
              <span style={{ fontSize:26, fontWeight:700, color:T.blue, fontFamily:T.mono, lineHeight:1 }}>{compensatieFactor.toFixed(1)}×</span>
            </div>
            <input type="range" min={0} max={1} step={0.1} value={compensatieFactor}
              onChange={e => setConfig(c=>({...c,compensatieFactor:+e.target.value}))}
              style={{ width:"100%", accentColor:T.blue }} />
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textTer, fontFamily:T.font, marginTop:2 }}>
              <span>0× geen</span><span>0.5× helft</span><span>1× volledig</span>
            </div>
          </div>

          <label style={{ fontSize:11, fontWeight:500, color:T.textSec, textTransform:"uppercase", letterSpacing:".04em", display:"block", marginBottom:8, fontFamily:T.font }}>Scenario</label>
          <div style={{ display:"flex", gap:6 }}>
            {[
              { id:"invaren",      label:"Invaren",              desc:"Iedereen vlakke premie" },
              { id:"eerbiedigend", label:"Eerbiedigende werking", desc:"Nieuw personeel vlak, huidig behoudt staffel" },
            ].map(s => {
              const sel = scenario === s.id;
              return (
                <div key={s.id} onClick={() => setConfig(c=>({...c,scenario:s.id}))}
                  style={{ flex:1, padding:"9px 11px", borderRadius:9, border:`1px solid ${sel?T.accent:T.border}`, background:sel?T.accentBg:T.bgSec, cursor:"pointer" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:sel?T.accent:T.text, fontFamily:T.font }}>{s.label}</div>
                  <div style={{ fontSize:10, color:T.textTer, marginTop:2, fontFamily:T.font }}>{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button onClick={onBerekenen}
        style={{ width:"100%", padding:"13px", borderRadius:10, background:T.accent, color:"#fff", border:"none", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:T.font, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Berekening uitvoeren
      </button>
    </div>
  );
}

// ─── Resultatenscreen ─────────────────────────────────────────────────────────
function ResultatenScherm({ resultaten, config, setConfig, werknemers, onTerugNaarConfig, onNaarB }) {
  const [sortCol, setSortCol]   = useState("leeftijd");
  const [sortDir, setSortDir]   = useState("asc");
  const [filterRood, setFilterRood] = useState(false);
  const [zoek, setZoek]         = useState("");

  const { vlakkePremie, compensatieFactor, scenario } = config;
  const isEerbiedigend = scenario === "eerbiedigend";

  const berekend = useMemo(() =>
    werknemers.map(w => {
      const base = berekenWerknemer(w, config.franchise, vlakkePremie, compensatieFactor);
      if (isEerbiedigend) return { ...base, verschilInleg:0, compensatieJaar:0, compensatieTotaal:0 };
      return base;
    }),
    [werknemers, config.franchise, vlakkePremie, compensatieFactor, isEerbiedigend]
  );

  const totaalCompensatie     = berekend.reduce((s,w) => s + w.compensatieTotaal, 0);
  const totaalCompensatieJaar = berekend.reduce((s,w) => s + w.compensatieJaar, 0);
  const geraaktWn             = berekend.filter(w => w.verschilInleg < 0).length;
  const gemVerschil           = berekend.reduce((s,w)=>s+w.verschilInleg,0) / berekend.length;
  const dubbeleLasten         = isEerbiedigend ? berekend.reduce((s,w) => s + w.inlegOud * 0.08 * w.restJaren * 0.5, 0) : 0;

  const cohortData = useMemo(() => {
    const map = {};
    berekend.forEach(w => {
      const key = `${Math.floor(w.leeftijd/5)*5}–${Math.floor(w.leeftijd/5)*5+4}`;
      const base = Math.floor(w.leeftijd/5)*5;
      if (!map[key]) map[key] = { label:key, compensatie:0, count:0, base };
      map[key].compensatie += w.compensatieTotaal;
      map[key].count++;
    });
    return Object.values(map).sort((a,b) => a.base - b.base);
  }, [berekend]);

  const tabelData = useMemo(() => {
    let data = [...berekend];
    if (filterRood) data = data.filter(w => w.verschilInleg < 0);
    if (zoek)       data = data.filter(w => w.naam.toLowerCase().includes(zoek.toLowerCase()));
    data.sort((a,b) => {
      const av = a[sortCol]??0, bv = b[sortCol]??0;
      const cmp = typeof av==="string" ? av.localeCompare(bv) : av-bv;
      return sortDir==="asc" ? cmp : -cmp;
    });
    return data;
  }, [berekend, sortCol, sortDir, filterRood, zoek]);

  const handleSort = (col) => {
    if (sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <h2 style={{ margin:"0 0 3px", fontSize:18, fontWeight:700, color:T.text, fontFamily:T.font }}>Transitieanalyse — Resultaten</h2>
          <p style={{ margin:0, fontSize:12, color:T.textSec }}>
            Oranje Techniek B.V. · {werknemers.length} werknemers · vlakke premie {vlakkePremie}%
          </p>
        </div>
        <button onClick={onTerugNaarConfig}
          style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:12, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Parameters aanpassen
        </button>
      </div>

      {/* Scenario toggle */}
      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"12px 16px", marginBottom:12 }}>
        <div style={{ fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, fontFamily:T.font }}>Scenario vergelijker</div>
        <div style={{ display:"flex", gap:8 }}>
          {[
            { id:"invaren",      icon:"⚡", label:"Invaren / Alles omzetten",     desc:"Eenmalige compensatielast, één regeling, minder administratie." },
            { id:"eerbiedigend", icon:"🕰", label:"Eerbiedigende werking",         desc:"Geen invaarcompensatie, maar dubbele administratie en oplopende staffelpremies." },
          ].map(s => {
            const sel = scenario === s.id;
            return (
              <div key={s.id} onClick={() => setConfig(c=>({...c,scenario:s.id}))}
                style={{ flex:1, padding:"11px 14px", borderRadius:10, border:`1.5px solid ${sel?T.accent:T.border}`, background:sel?T.accentBg:T.bgSec, cursor:"pointer", transition:"all .12s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <span style={{ fontSize:15 }}>{s.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:sel?T.accent:T.text, fontFamily:T.font }}>{s.label}</span>
                  {sel && <span style={{ marginLeft:"auto", fontSize:10, background:T.accent, color:"#fff", padding:"2px 7px", borderRadius:99, fontFamily:T.font }}>Actief</span>}
                </div>
                <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font, lineHeight:1.5 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>
        {isEerbiedigend && (
          <div style={{ marginTop:10, padding:"9px 12px", background:T.warnBg, borderRadius:8, fontSize:12, color:T.warnText, fontFamily:T.font }}>
            ⚠ Geschatte oplopende dubbele premielasten: <strong>{eurCompact(dubbeleLasten)}</strong> over de resterende looptijd. Twee parallelle regelingen vereisen afzonderlijke administratie.
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
        <KpiCard
          label={isEerbiedigend ? "Invaarcompensatie" : "Totale compensatielast"}
          value={isEerbiedigend ? "€ 0" : eurCompact(totaalCompensatie)}
          sub={isEerbiedigend ? "Geen invaarcompensatie" : "Over volledige looptijd"}
          color={!isEerbiedigend && totaalCompensatie>0 ? T.dangerText : T.accent}
          bg={!isEerbiedigend && totaalCompensatie>0 ? T.dangerBg : T.accentBg}
        />
        <KpiCard
          label="Jaarlast compensatie"
          value={isEerbiedigend ? "→ stijgend" : eurCompact(totaalCompensatieJaar)}
          sub={isEerbiedigend ? "Staffel stijgt elk jaar" : `Factor ${compensatieFactor.toFixed(1)}×`}
          color={isEerbiedigend ? T.warnText : T.blue}
          bg={isEerbiedigend ? T.warnBg : T.blueBg}
        />
        <KpiCard
          label="Geraakt werknemers"
          value={isEerbiedigend ? "0" : `${geraaktWn}`}
          sub={isEerbiedigend ? "Staffel blijft intact" : `van ${werknemers.length} gaan achteruit`}
          color={!isEerbiedigend && geraaktWn>0 ? T.dangerText : T.accent}
        />
        <KpiCard
          label="Gem. verschil inleg/jr"
          value={eurCompact(Math.abs(gemVerschil))}
          sub={gemVerschil>=0 ? "gemiddeld vooruit" : "gemiddeld achteruit"}
          color={gemVerschil>=0 ? T.accent : T.dangerText}
        />
      </div>

      {/* Live sliders compact */}
      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"11px 16px", marginBottom:12, display:"flex", gap:24, alignItems:"center" }}>
        <div style={{ fontSize:10, fontWeight:700, color:T.textTer, textTransform:"uppercase", letterSpacing:".06em", fontFamily:T.font, whiteSpace:"nowrap" }}>Live aanpassen</div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textSec, marginBottom:3, fontFamily:T.font }}>
            <span>Vlakke premie</span><strong style={{ color:T.accent, fontFamily:T.mono }}>{vlakkePremie}%</strong>
          </div>
          <input type="range" min={10} max={30} step={0.5} value={vlakkePremie}
            onChange={e => setConfig(c=>({...c,vlakkePremie:+e.target.value}))}
            style={{ width:"100%", accentColor:T.accent }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.textSec, marginBottom:3, fontFamily:T.font }}>
            <span>Compensatiefactor</span>
            <strong style={{ color: isEerbiedigend ? T.textTer : T.blue, fontFamily:T.mono }}>
              {isEerbiedigend ? "n.v.t." : `${compensatieFactor.toFixed(1)}×`}
            </strong>
          </div>
          <input type="range" min={0} max={1} step={0.1} value={compensatieFactor}
            onChange={e => setConfig(c=>({...c,compensatieFactor:+e.target.value}))}
            style={{ width:"100%", accentColor:T.blue, opacity: isEerbiedigend?0.3:1 }}
            disabled={isEerbiedigend} />
        </div>
      </div>

      {/* Cohort grafiek */}
      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"16px 18px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font }}>Compensatielast per leeftijdscohort</div>
            <div style={{ fontSize:11, color:T.textSec, marginTop:1, fontFamily:T.font }}>
              Totale compensatielast gegroepeerd per 5-jaarsgroep · hogere bars = hogere transitieschade
            </div>
          </div>
          {isEerbiedigend && <Pill color={T.warnText} bg={T.warnBg}>Geen compensatie in dit scenario</Pill>}
        </div>
        <div style={{ height:200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cohortData} margin={{ top:0, right:0, bottom:0, left:16 }}>
              <XAxis dataKey="label" tick={{ fontSize:11, fontFamily:T.font, fill:T.textTer }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={eurAs} tick={{ fontSize:10, fontFamily:T.mono, fill:T.textTer }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<CohortTooltip />} />
              <ReferenceLine y={0} stroke={T.border} />
              <Bar dataKey="compensatie" name="Compensatielast" radius={[4,4,0,0]} maxBarSize={44}>
                {cohortData.map((entry, i) => {
                  const maxVal = Math.max(...cohortData.map(d=>d.compensatie), 1);
                  const t = entry.compensatie / maxVal;
                  const r = Math.round(230*t + 29*(1-t));
                  const g = Math.round(75*t + 158*(1-t));
                  const b2 = Math.round(74*t + 117*(1-t));
                  return <Cell key={i} fill={isEerbiedigend ? "#e2e0d9" : `rgb(${r},${g},${b2})`} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Werknemerstabel */}
      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:14 }}>
        <div style={{ padding:"11px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font, flex:1 }}>Berekening per werknemer</div>
          <input value={zoek} onChange={e=>setZoek(e.target.value)} placeholder="Zoek naam…"
            style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, color:T.text, background:T.bgSec, outline:"none", width:150 }} />
          <button onClick={() => setFilterRood(f=>!f)}
            style={{ padding:"6px 11px", borderRadius:7, border:`1px solid ${filterRood?T.danger:T.border}`, background:filterRood?T.dangerBg:T.bgSec, fontSize:11, cursor:"pointer", fontFamily:T.font, color:filterRood?T.dangerText:T.textSec, whiteSpace:"nowrap" }}>
            {filterRood ? "✕ Filter uit" : "🔴 Alleen geraakt"}
          </button>
          <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>{tabelData.length} rijen</span>
        </div>
        <div style={{ overflowX:"auto", maxHeight:380, overflowY:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead style={{ position:"sticky", top:0, zIndex:1 }}>
              <tr>
                <SortHeader label="Naam"               col="naam"            sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Leeftijd"            col="leeftijd"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="center" />
                <SortHeader label="Salaris"             col="salaris"         sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortHeader label="Inleg oud / jr"      col="inlegOud"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortHeader label="Inleg nieuw / jr"    col="inlegNieuw"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortHeader label="Verschil / jr"       col="verschilInleg"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortHeader label="Compensatie totaal"  col="compensatieTotaal" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {tabelData.map((w, i) => {
                const rood  = w.verschilInleg < 0;
                const groen = w.verschilInleg > 0;
                return (
                  <tr key={w.id} style={{ background: i%2===0 ? T.bgCard : T.bgSec }}>
                    <td style={{ padding:"7px 10px", fontSize:12, fontFamily:T.font, color:T.text, whiteSpace:"nowrap" }}>{w.naam}</td>
                    <td style={{ padding:"7px 10px", fontSize:12, fontFamily:T.mono, color:T.textSec, textAlign:"center" }}>{w.leeftijd}</td>
                    <td style={{ padding:"7px 10px", fontSize:12, fontFamily:T.mono, color:T.textSec, textAlign:"right" }}>{eur(w.salaris)}</td>
                    <td style={{ padding:"7px 10px", fontSize:12, fontFamily:T.mono, color:T.textSec, textAlign:"right" }}>{eur(w.inlegOud)}</td>
                    <td style={{ padding:"7px 10px", fontSize:12, fontFamily:T.mono, color:T.textSec, textAlign:"right" }}>{eur(w.inlegNieuw)}</td>
                    <td style={{ padding:"7px 10px", fontSize:12, fontFamily:T.mono, fontWeight:600, textAlign:"right",
                      color: rood ? T.dangerText : groen ? T.accent : T.textSec,
                      background: rood ? `${T.danger}10` : groen ? `${T.accent}08` : "transparent" }}>
                      {rood ? "▼ " : groen ? "▲ " : ""}{eur(Math.abs(w.verschilInleg))}
                    </td>
                    <td style={{ padding:"7px 10px", fontSize:12, fontFamily:T.mono, textAlign:"right",
                      color: isEerbiedigend ? T.textTer : w.compensatieTotaal>0 ? T.dangerText : T.textTer }}>
                      {isEerbiedigend ? "—" : w.compensatieTotaal > 0 ? eur(w.compensatieTotaal) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop:`1px solid ${T.border}`, padding:"8px 14px", display:"flex", justifyContent:"flex-end", gap:16, background:T.bgSec }}>
          <span style={{ fontSize:12, color:T.textTer, fontFamily:T.font }}>Totaal compensatielast:</span>
          <span style={{ fontSize:13, fontWeight:700, fontFamily:T.mono,
            color: isEerbiedigend ? T.accent : totaalCompensatie>0 ? T.dangerText : T.accent }}>
            {isEerbiedigend ? "€ 0 (eerbiedigend)" : eur(totaalCompensatie)}
          </span>
        </div>
      </div>

      {/* Opslaan + navigatie footer */}
      <OpslaanFooter onNaarB={onNaarB} config={config} aantalWerknemers={werknemers.length} />
    </div>
  );
}

// ─── Opslaan footer component ─────────────────────────────────────────────────
function OpslaanFooter({ onNaarB, config, aantalWerknemers }) {
  const [status, setStatus] = useState("idle"); // idle | saving | saved

  const opslaan = () => {
    setStatus("saving");
    // Simuleer API call: POST /api/analyse/transitie
    setTimeout(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    }, 900);
  };

  return (
    <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
      {/* Status info */}
      <div style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>
        {status === "saved" ? (
          <span style={{ color:T.accent, fontWeight:500 }}>✓ Berekening opgeslagen in dossier</span>
        ) : (
          <span>
            <span style={{ color:T.textTer }}>Vlakke premie:</span>{" "}
            <span style={{ fontFamily:T.mono, fontWeight:600, color:T.text }}>{config.vlakkePremie}%</span>
            <span style={{ color:T.textTer, margin:"0 8px" }}>·</span>
            <span style={{ color:T.textTer }}>Factor:</span>{" "}
            <span style={{ fontFamily:T.mono, fontWeight:600, color:T.text }}>{config.compensatieFactor.toFixed(1)}×</span>
            <span style={{ color:T.textTer, margin:"0 8px" }}>·</span>
            <span style={{ fontFamily:T.mono, color:T.textSec }}>{aantalWerknemers} werknemers</span>
          </span>
        )}
      </div>

      {/* Knoppen */}
      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
        <button
          onClick={opslaan}
          disabled={status === "saving"}
          style={{
            padding:"9px 16px", borderRadius:8,
            border:`1px solid ${status === "saved" ? T.accent : T.border}`,
            background: status === "saved" ? T.accentBg : T.bgSec,
            color: status === "saved" ? T.accent : T.text,
            fontSize:13, fontWeight:500, cursor: status === "saving" ? "not-allowed" : "pointer",
            fontFamily:T.font, display:"flex", alignItems:"center", gap:6,
            opacity: status === "saving" ? 0.6 : 1, transition:"all .2s",
          }}>
          {status === "saving" ? (
            <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</span> Opslaan…</>
          ) : status === "saved" ? (
            <>✓ Opgeslagen</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 9.5V11h1.5L10 4.5 8.5 3 2 9.5zM11.5 2.5a1 1 0 0 0-1.4 0l-1 1 1.4 1.4 1-1a1 1 0 0 0 0-1.4z" fill="currentColor"/></svg>Berekening opslaan</>
          )}
        </button>

        <button
          onClick={onNaarB}
          style={{
            padding:"9px 18px", borderRadius:8, border:"none",
            background:T.accent, color:"#fff",
            fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:T.font, display:"flex", alignItems:"center", gap:7,
          }}>
          Naar productvergelijking
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Analyse21({ onNaarB }) {
  const [scherm, setScherm]         = useState("config");
  const [werknemers, setWerknemers] = useState(MOCK_WERKNEMERS);
  const [showImport, setShowImport] = useState(false);
  const [config, setConfig]         = useState({
    franchise: 17545,
    vlakkePremie: 20,
    compensatieFactor: 1.0,
    scenario: "invaren",
  });

  useEffect(() => {
    if (!document.getElementById("af-font")) {
      const l = document.createElement("link"); l.id="af-font"; l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  const handleImport = (nw) => setWerknemers(nw);
  const handleBerekenen = () => setScherm("resultaten");

  return (
    <div style={{ fontFamily:T.font, maxWidth:920, margin:"0 auto", padding:"24px", background:T.bg, minHeight:"100vh" }}>

      {/* Breadcrumb + tabs */}
      <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textTer, marginBottom:20, fontFamily:T.font }}>
        <span>Oranje Techniek B.V.</span>
        <span>/</span><span>Adviestraject</span>
        <span>/</span><span style={{ color:T.text, fontWeight:500 }}>Analyse</span>
        <span>/</span><span style={{ color:T.accent, fontWeight:600 }}>2.1 WTP-Transitie</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
          {[{n:"2.1",l:"Transitie",a:true},{n:"2.2",l:"Productvergelijking",a:false},{n:"2.3",l:"Beleggingsbeleid",a:false}].map(t=>(
            <div key={t.n} style={{ padding:"4px 10px", borderRadius:7, fontSize:11, fontWeight:500, fontFamily:T.font,
              background:t.a?T.accent:T.bgSec, color:t.a?"#fff":T.textTer,
              border:`0.5px solid ${t.a?T.accent:T.border}`, opacity:t.a?1:0.55 }}>{t.n} {t.l}</div>
          ))}
        </div>
      </div>

      {scherm === "config" && (
        <ConfigScherm
          config={config} setConfig={setConfig}
          werknemers={werknemers}
          onImportOpen={() => setShowImport(true)}
          onBerekenen={handleBerekenen}
        />
      )}

      {scherm === "resultaten" && (
        <ResultatenScherm
          resultaten={[]}
          config={config} setConfig={setConfig}
          werknemers={werknemers}
          onTerugNaarConfig={() => setScherm("config")}
          onNaarB={() => onNaarB && onNaarB()}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
