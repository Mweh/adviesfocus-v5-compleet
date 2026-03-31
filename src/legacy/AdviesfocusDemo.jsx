import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

// ─────────────────────────────────────────────────────────────────
// UITVOERDERS — echte marktdata 2026
// ─────────────────────────────────────────────────────────────────
const UITVOERDERS = {
  nn: {
    naam: "Nationale-Nederlanden",
    logo: "NN",
    kleur: "#E87722",
    premie: 19.5,
    uitvoeringskosten: 0.42,
    lifecycle: "Horizon",
    nabestaanden: "RVP op risicobasis",
    anw: true,
    ao: "WIA-excedent",
    keuzes: ["lifecycle keuze", "hoog/laag", "uitruil OP/PP", "bedrag ineens"],
    urm_opslag: 1.04,
    rating: { prijs: 88, dekking: 82, keuze: 90 },
    toelichting: "Marktleider DC. Horizon lifecycle met automatische risico-afbouw. Sterk in keuzebegeleiding via NN.nl-portaal.",
  },
  asr: {
    naam: "a.s.r.",
    logo: "ASR",
    kleur: "#00A550",
    premie: 20.1,
    uitvoeringskosten: 0.38,
    lifecycle: "Actief",
    nabestaanden: "RVP op risicobasis",
    anw: true,
    ao: "WIA-excedent",
    keuzes: ["lifecycle keuze", "hoog/laag", "uitruil OP/PP"],
    urm_opslag: 1.02,
    rating: { prijs: 82, dekking: 86, keuze: 78 },
    toelichting: "Solide aanbieder met lage kosten. Lifecycle minder flexibel dan NN. Sterke service voor MKB.",
  },
  befrank: {
    naam: "BeFrank",
    logo: "BF",
    kleur: "#004B87",
    premie: 18.8,
    uitvoeringskosten: 0.29,
    lifecycle: "Persoonlijk",
    nabestaanden: "RVP op risicobasis",
    anw: false,
    ao: "Basis",
    keuzes: ["lifecycle keuze", "hoog/laag", "uitruil OP/PP", "bedrag ineens", "eigen allocatie"],
    urm_opslag: 1.06,
    rating: { prijs: 94, dekking: 71, keuze: 95 },
    toelichting: "Laagste premie + kosten. PPI-model (geen verzekeraar). Beste digitale keuzeomgeving. Geen ANW standaard.",
  },
  aegon: {
    naam: "Aegon",
    logo: "AE",
    kleur: "#00AEEF",
    premie: 20.8,
    uitvoeringskosten: 0.45,
    lifecycle: "Stabiel",
    nabestaanden: "RVP op risicobasis",
    anw: true,
    ao: "WIA-excedent",
    keuzes: ["lifecycle keuze", "uitruil OP/PP"],
    urm_opslag: 1.00,
    rating: { prijs: 76, dekking: 84, keuze: 70 },
    toelichting: "Groot netwerk, bewezen uitvoerder. Hogere kosten. Lifecycle minder flexibel. Sterk bij grote werkgevers.",
  },
};

// ─────────────────────────────────────────────────────────────────
// DEMO DATA — NLPensioen klant
// ─────────────────────────────────────────────────────────────────
const KLANT = {
  naam: "Oranje Techniek B.V.",
  kvk: "12345678",
  contactpersoon: "J. de Vries",
  adviseur: "D. Wietzema Menkhorst",
  kantoor: "NLPensioen B.V.",
  loonsom: 2_923_000,
  werknemers: 45,
  huidigPremiePerc: 17.6,
  huidigUitvoerder: "ASR (staffelregeling)",
  cao: "Metaal & Techniek",
  franchise: 17_545,
  doelPremiePerc: 20,
};

// Werknemerspopulatie voor cohortberekening
const COHORTEN = [
  { leeftijd: "25–34", n: 8,  gemSalaris: 38_500, factor: 0.054 },
  { leeftijd: "35–44", n: 14, gemSalaris: 54_000, factor: 0.112 },
  { leeftijd: "45–54", n: 15, gemSalaris: 68_000, factor: 0.176 },
  { leeftijd: "55–64", n: 8,  gemSalaris: 81_000, factor: 0.229 },
];

// ─────────────────────────────────────────────────────────────────
// REKENMODULE
// ─────────────────────────────────────────────────────────────────
function berekenCohort(cohort, vlakPremie, franchise) {
  const grondslag = Math.max(0, cohort.gemSalaris - franchise);
  const inlegOud  = grondslag * cohort.factor * cohort.n;
  const inlegNieuw= grondslag * (vlakPremie / 100) * cohort.n;
  const diff      = inlegNieuw - inlegOud;
  return { ...cohort, grondslag, inlegOud, inlegNieuw, diff };
}

function berekenURM(kapitaal, leeftijd, equityPct, kostenBps = 20) {
  const jr       = Math.max(0, 67 - leeftijd);
  const kostFact = 1 - (kostenBps / 10000);
  const p5  = Math.round(kapitaal * Math.pow(1.01 * kostFact, jr));
  const p50 = Math.round(kapitaal * Math.pow(1.04 * kostFact, jr));
  const p95 = Math.round(kapitaal * Math.pow(1.07 * kostFact, jr));
  const annuiteit = (k) => { const r=0.02/12,n=240; return Math.round(k*(r*(1+r)**n)/((1+r)**n-1)); };
  return { p5: annuiteit(p5), p50: annuiteit(p50), p95: annuiteit(p95) };
}

function scoreUitvoerder(uitv, profiel) {
  const w = {
    goedkoopst:   { prijs: 0.40, dekking: 0.25, keuze: 0.20, kosten: 0.15 },
    dekking:      { prijs: 0.20, dekking: 0.45, keuze: 0.20, kosten: 0.15 },
    keuze:        { prijs: 0.20, dekking: 0.20, keuze: 0.45, kosten: 0.15 },
  }[profiel] || { prijs: 0.33, dekking: 0.33, keuze: 0.34, kosten: 0 };
  const kostenScore = Math.max(0, 100 - uitv.uitvoeringskosten * 100);
  return Math.round(
    uitv.rating.prijs   * w.prijs +
    uitv.rating.dekking * w.dekking +
    uitv.rating.keuze   * w.keuze +
    kostenScore         * (w.kosten || 0)
  );
}

// ─────────────────────────────────────────────────────────────────
// DESIGN SYSTEM
// ─────────────────────────────────────────────────────────────────
const C = {
  bg:       "#0f0f0e",
  surface:  "#1a1a18",
  surf2:    "#222220",
  border:   "rgba(255,255,255,0.08)",
  border2:  "rgba(255,255,255,0.04)",
  text:     "#f0efe8",
  textSec:  "rgba(240,239,232,0.55)",
  textTer:  "rgba(240,239,232,0.30)",
  accent:   "#1d9e75",
  accentBg: "rgba(29,158,117,0.12)",
  warn:     "#ef9f27",
  warnBg:   "rgba(239,159,39,0.12)",
  danger:   "#e24b4a",
  dangerBg: "rgba(226,75,74,0.12)",
  blue:     "#4a9eff",
  blueBg:   "rgba(74,158,255,0.12)",
  gold:     "#f0c040",
  goldBg:   "rgba(240,192,64,0.12)",
};

const F = { sans: "'Syne', 'DM Sans', system-ui, sans-serif", mono: "'DM Mono', monospace" };

function eur(n) { return new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n??0); }
function eurM(n) { const v=n??0; return v>=1e6?`€ ${(v/1e6).toFixed(1).replace(".",",")} mln`:v>=1e3?`€ ${(v/1e3).toFixed(0)}k`:eur(v); }
function pct(n,d=1) { return `${(+n).toFixed(d)}%`; }

function Tag({children,kleur=C.accent,bg=C.accentBg,small=false}) {
  return <span style={{fontSize:small?9:10,fontWeight:700,color:kleur,background:bg,padding:small?"1px 6px":"2px 9px",borderRadius:99,letterSpacing:".06em",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:F.sans}}>{children}</span>;
}

function Glow({kleur="#1d9e75",size=200,x="50%",y="50%",opacity=0.15}) {
  return <div style={{position:"absolute",width:size,height:size,borderRadius:"50%",background:kleur,filter:"blur(60px)",opacity,left:x,top:y,transform:"translate(-50%,-50%)",pointerEvents:"none",zIndex:0}}/>;
}

// ─────────────────────────────────────────────────────────────────
// STAP-INDICATOR
// ─────────────────────────────────────────────────────────────────
const STAPPEN = [
  { id:0, label:"Klant",         icon:"🏢" },
  { id:1, label:"Transitie",     icon:"📊" },
  { id:2, label:"Vergelijking",  icon:"⚖️"  },
  { id:3, label:"Rapport",       icon:"📄" },
  { id:4, label:"Portaal",       icon:"👤" },
];

function StapIndicator({ actief }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:0,padding:"0 4px"}}>
      {STAPPEN.map((s, i) => {
        const done   = i < actief;
        const active = i === actief;
        return (
          <div key={s.id} style={{display:"flex",alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                background: done?C.accent:active?"rgba(29,158,117,0.2)":"rgba(255,255,255,0.06)",
                border: `1.5px solid ${done?C.accent:active?C.accent:"rgba(255,255,255,0.12)"}`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
                boxShadow: active?`0 0 16px ${C.accent}55`:"none",
                transition:"all .3s",
              }}>
                {done ? <span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span> : s.icon}
              </div>
              <span style={{fontSize:9,fontWeight:active?700:400,color:active?C.accent:C.textTer,letterSpacing:".06em",textTransform:"uppercase",fontFamily:F.sans}}>{s.label}</span>
            </div>
            {i < STAPPEN.length-1 && (
              <div style={{width:48,height:1,background:done?C.accent:"rgba(255,255,255,0.08)",margin:"0 4px",marginBottom:16,transition:"background .3s"}}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STAP 0 — KLANTPROFIEL
// ─────────────────────────────────────────────────────────────────
function StapKlant({ onVolgende }) {
  const [naam,  setNaam]  = useState(KLANT.naam);
  const [wn,    setWn]    = useState(KLANT.werknemers);
  const [ls,    setLs]    = useState(KLANT.loonsom);
  const [ready, setReady] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 300); }, []);

  return (
    <div style={{maxWidth:640,margin:"0 auto"}}>
      <div style={{marginBottom:32,opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(20px)",transition:"all .5s"}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8,fontFamily:F.sans}}>Stap 1 van 5</div>
        <h1 style={{fontSize:32,fontWeight:700,color:C.text,margin:"0 0 8px",fontFamily:F.sans,lineHeight:1.15}}>Klantprofiel instellen</h1>
        <p style={{fontSize:15,color:C.textSec,margin:0,lineHeight:1.6}}>Vul de basisgegevens in. Dit stuurt alle berekeningen, de productvergelijking en het adviesrapport.</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20,opacity:ready?1:0,transition:"opacity .6s .1s"}}>
        {[
          ["Bedrijfsnaam",    naam,  setNaam,  "text",   "Oranje Techniek B.V."],
          ["KvK-nummer",      "12345678", ()=>{}, "text", "12345678"],
          ["Werknemers",      wn,    setWn,    "number", "45"],
          ["Loonsom (€/jr)",  ls,    setLs,    "number", "2923000"],
        ].map(([l,v,s,t,ph]) => (
          <div key={l}>
            <label style={{fontSize:10,fontWeight:700,color:C.textTer,textTransform:"uppercase",letterSpacing:".08em",display:"block",marginBottom:6,fontFamily:F.sans}}>{l}</label>
            <input type={t} defaultValue={v} placeholder={ph}
              style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surf2,color:C.text,fontSize:13,fontFamily:F.mono,outline:"none",boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
        ))}
      </div>

      {/* Automatisch herkend */}
      <div style={{background:C.accentBg,border:`1px solid ${C.accent}33`,borderRadius:12,padding:"14px 16px",marginBottom:24,opacity:ready?1:0,transition:"opacity .6s .2s"}}>
        <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:10,letterSpacing:".06em",textTransform:"uppercase",fontFamily:F.sans}}>✓ Automatisch herkend</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[
            ["CAO","Metaal & Techniek"],
            ["BPF-plicht","Geen"],
            ["Huidig type","Staffelregeling (DB)"],
            ["Franchise 2026","€ 17.545"],
            ["Pensioenlasten","€ 514.048/jr (17,6%)"],
            ["Signaleringsgrens","✓ Onder 15% grens"],
          ].map(([l,v]) => (
            <div key={l}>
              <div style={{fontSize:9,color:C.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2,fontFamily:F.sans}}>{l}</div>
              <div style={{fontSize:12,color:C.text,fontFamily:l==="Pensioenlasten"||l==="Franchise 2026"?F.mono:F.sans,fontWeight:500}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onVolgende}
        style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.accent},#15795b)`,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:F.sans,
          boxShadow:`0 0 32px ${C.accent}44`,letterSpacing:".02em",opacity:ready?1:0,transition:"opacity .6s .3s"}}>
        Transitieanalyse starten →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STAP 1 — WTP TRANSITIE
// ─────────────────────────────────────────────────────────────────
function StapTransitie({ onVolgende }) {
  const [premie,    setPremie]    = useState(20);
  const [scenario,  setScenario]  = useState("invaren");
  const [compFact,  setCompFact]  = useState(1.0);

  const cohorten  = COHORTEN.map(c => berekenCohort(c, premie, KLANT.franchise));
  const totOud    = cohorten.reduce((s,c) => s+c.inlegOud,  0);
  const totNieuw  = cohorten.reduce((s,c) => s+c.inlegNieuw, 0);
  const totDiff   = totNieuw - totOud;
  const compLast  = cohorten.filter(c=>c.diff<0).reduce((s,c)=>s+Math.abs(c.diff)*compFact,0)*5; // 5jr comp

  const grafData = cohorten.map(c => ({
    naam:    c.leeftijd,
    oud:     Math.round(c.inlegOud/1000),
    nieuw:   Math.round(c.inlegNieuw/1000),
    diff:    Math.round(c.diff/1000),
    kleur:   c.diff >= 0 ? C.accent : C.danger,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = cohorten.find(c => c.leeftijd === label);
    return (
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",fontSize:11,fontFamily:F.sans}}>
        <div style={{fontWeight:700,marginBottom:6,color:C.text}}>Leeftijdscohort {label}</div>
        <div style={{color:C.textSec,marginBottom:2}}>{d?.n} werknemers · gem. {eur(d?.gemSalaris)}/jr</div>
        <div style={{color:C.textSec,marginBottom:2}}>Inleg oud:  {eur(d?.inlegOud)}</div>
        <div style={{color:C.textSec,marginBottom:2}}>Inleg nieuw: {eur(d?.inlegNieuw)}</div>
        <div style={{color:d?.diff>=0?C.accent:C.danger,fontWeight:700}}>Verschil: {d?.diff>=0?"+":""}{eur(d?.diff)}</div>
      </div>
    );
  };

  return (
    <div style={{maxWidth:760,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8,fontFamily:F.sans}}>Stap 2 van 5</div>
        <h1 style={{fontSize:28,fontWeight:700,color:C.text,margin:"0 0 4px",fontFamily:F.sans}}>WTP-Transitieanalyse</h1>
        <p style={{fontSize:13,color:C.textSec,margin:0}}>Van staffelregeling naar vlakke premie — impact per leeftijdscohort.</p>
      </div>

      {/* Controls */}
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <label style={{fontSize:10,fontWeight:700,color:C.textTer,textTransform:"uppercase",letterSpacing:".08em",display:"block",marginBottom:6,fontFamily:F.sans}}>Vlakke premie</label>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input type="range" min={15} max={27} step={0.5} value={premie} onChange={e=>setPremie(+e.target.value)}
              style={{flex:1,accentColor:C.accent}}/>
            <span style={{fontSize:20,fontWeight:700,color:C.accent,fontFamily:F.mono,width:52,textAlign:"right"}}>{pct(premie)}</span>
          </div>
        </div>
        <div>
          <label style={{fontSize:10,fontWeight:700,color:C.textTer,textTransform:"uppercase",letterSpacing:".08em",display:"block",marginBottom:6,fontFamily:F.sans}}>Scenario</label>
          <div style={{display:"flex",gap:6}}>
            {[["invaren","Invaren"],["eerbiedigend","Eerbiedigend"]].map(([v,l])=>(
              <button key={v} onClick={()=>setScenario(v)}
                style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${scenario===v?C.accent:C.border}`,background:scenario===v?C.accentBg:"transparent",color:scenario===v?C.accent:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans,fontWeight:scenario===v?700:400}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          [eurM(totOud),       "Huidige jaarlast",   C.textSec, C.surface],
          [eurM(totNieuw),     "Nieuwe jaarlast",    C.text,    C.surf2],
          [eurM(Math.abs(totDiff)), totDiff>=0?"Lastenstijging":"Lastendaling", totDiff>=0?C.danger:C.accent, totDiff>=0?C.dangerBg:C.accentBg],
          [eurM(compLast),     "Compensatielast",    C.warn,    C.warnBg],
        ].map(([v,l,kl,bg])=>(
          <div key={l} style={{background:bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px"}}>
            <div style={{fontSize:10,color:C.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:4,fontFamily:F.sans}}>{l}</div>
            <div style={{fontSize:20,fontWeight:700,color:kl,fontFamily:F.mono}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Cohort grafiek */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:12,fontFamily:F.sans}}>Premie-impact per leeftijdscohort — oud vs. nieuw ({pct(premie)} vlak)</div>
        <div style={{height:180}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grafData} barGap={4} barSize={28} margin={{top:4,right:4,bottom:0,left:8}}>
              <XAxis dataKey="naam" tick={{fill:C.textSec,fontSize:11,fontFamily:F.sans}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`€${v}k`} tick={{fill:C.textTer,fontSize:9,fontFamily:F.mono}} axisLine={false} tickLine={false} width={42}/>
              <Tooltip content={<CustomTooltip/>}/>
              <ReferenceLine y={0} stroke={C.border} strokeWidth={1}/>
              <Bar dataKey="oud"  name="Oud" fill="rgba(240,239,232,0.12)" radius={[4,4,0,0]}/>
              <Bar dataKey="nieuw" name="Nieuw" radius={[4,4,0,0]}>
                {grafData.map((d,i)=><Cell key={i} fill={d.kleur} fillOpacity={0.8}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:"flex",gap:12,marginTop:8,fontSize:10,color:C.textTer,fontFamily:F.sans}}>
          <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"rgba(240,239,232,0.12)",display:"inline-block"}}/> Huidige staffelpremie</span>
          <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.accent,display:"inline-block"}}/> Vlakke premie {pct(premie)}</span>
          <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.danger,display:"inline-block"}}/> Lastendaling cohort</span>
        </div>
      </div>

      <button onClick={onVolgende}
        style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.accent},#15795b)`,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F.sans,boxShadow:`0 0 24px ${C.accent}33`}}>
        Aanbieders vergelijken →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STAP 2 — PRODUCTVERGELIJKING
// ─────────────────────────────────────────────────────────────────
function StapVergelijking({ onVolgende }) {
  const [profiel,    setProfiel]    = useState("keuze");
  const [geselecteerd, setGeselecteerd] = useState(null);

  const scores = Object.entries(UITVOERDERS).map(([id,u]) => ({
    id, ...u, score: scoreUitvoerder(u, profiel),
  })).sort((a,b) => b.score - a.score);

  const winnaar = scores[0];

  useEffect(() => { if (!geselecteerd) setGeselecteerd(winnaar.id); }, [profiel]);

  const gesData = geselecteerd ? UITVOERDERS[geselecteerd] : null;

  return (
    <div style={{maxWidth:860,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8,fontFamily:F.sans}}>Stap 3 van 5</div>
        <h1 style={{fontSize:28,fontWeight:700,color:C.text,margin:"0 0 4px",fontFamily:F.sans}}>Productvergelijking</h1>
        <p style={{fontSize:13,color:C.textSec,margin:0}}>Vier uitvoerders vergeleken op basis van marktdata 2026. Alle premies en kosten zijn actueel.</p>
      </div>

      {/* Scoremodel */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        <span style={{fontSize:11,color:C.textSec,alignSelf:"center",marginRight:4,fontFamily:F.sans}}>Scoremodel:</span>
        {[["goedkoopst","💰 Goedkoopst"],["dekking","🛡 Beste dekking"],["keuze","⚙️ Meeste keuze"]].map(([v,l])=>(
          <button key={v} onClick={()=>setProfiel(v)}
            style={{padding:"6px 13px",borderRadius:7,border:`1px solid ${profiel===v?C.accent:C.border}`,background:profiel===v?C.accentBg:"transparent",color:profiel===v?C.accent:C.textSec,fontSize:11,cursor:"pointer",fontFamily:F.sans,fontWeight:profiel===v?700:400}}>
            {l}
          </button>
        ))}
      </div>

      {/* Kaarten */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {scores.map((u,rank) => {
          const sel = geselecteerd === u.id;
          const first = rank === 0;
          return (
            <div key={u.id} onClick={()=>setGeselecteerd(u.id)}
              style={{background:sel?`linear-gradient(135deg,${C.accentBg},${C.surf2})`:C.surface,border:`1.5px solid ${sel?C.accent:first?"rgba(255,255,255,0.15)":C.border}`,borderRadius:14,padding:"14px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .2s",
                boxShadow:sel?`0 0 20px ${C.accent}33`:"none"}}>
              {first&&!sel&&<div style={{position:"absolute",top:8,right:8}}><Tag small>Aanbevolen</Tag></div>}
              {sel&&<div style={{position:"absolute",top:8,right:8}}><Tag small>Geselecteerd</Tag></div>}

              {/* Logo */}
              <div style={{width:36,height:36,borderRadius:9,background:`${u.kleur}22`,border:`1px solid ${u.kleur}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:u.kleur,marginBottom:10,fontFamily:F.sans}}>
                {u.logo}
              </div>

              <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:2,fontFamily:F.sans}}>{u.naam}</div>
              <div style={{fontSize:22,fontWeight:700,color:sel?C.accent:C.gold,fontFamily:F.mono,marginBottom:8}}>{u.score}</div>

              {/* Mini bars */}
              {[["Premie",u.premie+"%"],[`Kosten`,pct(u.uitvoeringskosten)],["Score",u.score]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:9,color:C.textTer,fontFamily:F.sans}}>{l}</span>
                  <span style={{fontSize:10,fontWeight:600,color:C.textSec,fontFamily:F.mono}}>{v}</span>
                </div>
              ))}

              {/* Score bar */}
              <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:99,marginTop:6,overflow:"hidden"}}>
                <div style={{width:`${u.score}%`,height:"100%",background:sel?C.accent:u.kleur,borderRadius:99,opacity:.7}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail geselecteerde aanbieder */}
      {gesData && (
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:`${gesData.kleur}22`,border:`1px solid ${gesData.kleur}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:gesData.kleur,fontFamily:F.sans}}>{gesData.logo}</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:F.sans}}>{gesData.naam}</div>
              <div style={{fontSize:11,color:C.textSec,fontFamily:F.sans}}>{gesData.toelichting}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
            {[
              ["Vlakke premie",        pct(gesData.premie)],
              ["Uitvoeringskosten",    pct(gesData.uitvoeringskosten)+" (excl. vermogensbeheer)"],
              ["Lifecycle",            gesData.lifecycle],
              ["Nabestaandenpensioen", gesData.nabestaanden],
              ["ANW-aanvulling",       gesData.anw?"Standaard inbegrepen":"Niet standaard"],
              ["AO-aanvulling",        gesData.ao],
            ].map(([l,v])=>(
              <div key={l} style={{background:C.surf2,borderRadius:9,padding:"9px 11px"}}>
                <div style={{fontSize:9,color:C.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3,fontFamily:F.sans}}>{l}</div>
                <div style={{fontSize:12,fontWeight:500,color:C.text,fontFamily:F.sans}}>{v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:9,color:C.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6,fontFamily:F.sans}}>Keuzeopties werknemer</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {gesData.keuzes.map(k=><Tag key={k} kleur={C.blue} bg={C.blueBg} small>{k}</Tag>)}
            </div>
          </div>
        </div>
      )}

      {/* Vergelijkingstabel */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",marginBottom:16}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.surf2}}>
              <th style={{padding:"9px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:C.textTer,textTransform:"uppercase",letterSpacing:".06em",fontFamily:F.sans,borderBottom:`1px solid ${C.border}`}}>Kenmerk</th>
              {scores.map(u=><th key={u.id} style={{padding:"9px 12px",textAlign:"center",fontSize:10,fontWeight:700,color:u.id===geselecteerd?C.accent:C.textSec,fontFamily:F.sans,borderBottom:`1px solid ${C.border}`}}>{u.naam.split(" ")[0]}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ["Premie",    scores.map(u=>pct(u.premie))],
              ["Kosten",    scores.map(u=>pct(u.uitvoeringskosten))],
              ["Lifecycle", scores.map(u=>u.lifecycle)],
              ["ANW",       scores.map(u=>u.anw?"✓":"—")],
              ["Score",     scores.map(u=>String(u.score))],
            ].map(([l,vals],ri)=>(
              <tr key={l} style={{background:ri%2===0?"transparent":C.surf2}}>
                <td style={{padding:"8px 12px",fontSize:11,color:C.textSec,fontFamily:F.sans,borderBottom:`1px solid ${C.border2}`}}>{l}</td>
                {vals.map((v,i)=>(
                  <td key={i} style={{padding:"8px 12px",textAlign:"center",fontSize:11,fontWeight:scores[i]?.id===geselecteerd?700:400,color:scores[i]?.id===geselecteerd?C.accent:C.text,fontFamily:F.mono,borderBottom:`1px solid ${C.border2}`}}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={onVolgende}
        style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.accent},#15795b)`,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F.sans,boxShadow:`0 0 24px ${C.accent}33`}}>
        Adviesrapport genereren →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STAP 3 — ADVIESRAPPORT
// ─────────────────────────────────────────────────────────────────
function StapRapport({ onVolgende }) {
  const [genereren, setGenereren] = useState(false);
  const [klaar,     setKlaar]     = useState(false);
  const [voortgang, setVoortgang] = useState(0);
  const [stap,      setStap]      = useState("");

  const STAPS = [
    [15, "Klantprofiel valideren (Wft art. 4:23)…"],
    [30, "WTP-transitieberekeningen verwerken…"],
    [48, "Productvergelijking opnemen (Bgfo art. 80a)…"],
    [62, "URM-projecties invoegen (DNB 2026Q1)…"],
    [78, "Managementsamenvatting genereren…"],
    [92, "Adviesrapport opmaken in Word-sjabloon…"],
    [100,"Rapport gereed — trace-ID toegekend"],
  ];

  function startGenereren() {
    setGenereren(true);
    let i = 0;
    const run = () => {
      if (i >= STAPS.length) { setKlaar(true); return; }
      const [pct, msg] = STAPS[i++];
      setVoortgang(pct); setStap(msg);
      setTimeout(run, 600 + Math.random()*400);
    };
    setTimeout(run, 300);
  }

  const HOOFDSTUKKEN = [
    ["01","Klantprofiel & uitgangsituatie",       "Wft art. 4:23",    "✓"],
    ["02","Financiële positie werkgever",         "Module A",          "✓"],
    ["03","Kennis & ervaring (Gemiddeld)",         "Module B",          "✓"],
    ["04","Doelstellingen & risicobereidheid",    "Module C",          "✓"],
    ["05","WTP-transitieanalyse",                 "Art. 150l Wtp",     "✓"],
    ["06","Compensatieberekening per cohort",     "Overgangsrecht Wtp","✓"],
    ["07","Productvergelijking (4 aanbieders)",   "Bgfo art. 80a",     "✓"],
    ["08","Aanbeveling + onderbouwing",           "Bgfo art. 80a",     "✓"],
    ["09","Afgewezen alternatieven",              "AFM-vereiste",      "✓"],
    ["10","Beleggingsbeleid & URM-projecties",    "DNB 2026Q1",        "✓"],
    ["11","Financiële impact voor werkgever",     "—",                 "✓"],
    ["12","Communicatieplan & tijdlijn",          "Pw art. 48a",       "✓"],
  ];

  return (
    <div style={{maxWidth:680,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8,fontFamily:F.sans}}>Stap 4 van 5</div>
        <h1 style={{fontSize:28,fontWeight:700,color:C.text,margin:"0 0 4px",fontFamily:F.sans}}>Adviesrapport</h1>
        <p style={{fontSize:13,color:C.textSec,margin:0}}>12-hoofdstukken Word-rapport — deterministisch gegenereerd, volledig AFM-compliant, direct te versturen aan de werkgever.</p>
      </div>

      {!genereren && !klaar && (
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px",marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:14,fontFamily:F.sans}}>Inhoud rapport — 12 hoofdstukken</div>
          {HOOFDSTUKKEN.map(([nr,titel,grondslag,status])=>(
            <div key={nr} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border2}`}}>
              <span style={{fontSize:10,fontWeight:700,color:C.textTer,width:22,fontFamily:F.mono}}>{nr}</span>
              <span style={{flex:1,fontSize:12,color:C.text,fontFamily:F.sans}}>{titel}</span>
              <span style={{fontSize:9,color:C.textTer,fontFamily:F.sans}}>{grondslag}</span>
              <span style={{fontSize:12,color:C.accent}}>{status}</span>
            </div>
          ))}
        </div>
      )}

      {genereren && !klaar && (
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"32px 20px",marginBottom:20,textAlign:"center"}}>
          <div style={{fontSize:13,color:C.accent,marginBottom:14,fontFamily:F.sans}}>{stap}</div>
          <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",marginBottom:8}}>
            <div style={{width:`${voortgang}%`,height:"100%",background:`linear-gradient(90deg,${C.accent},#25c98f)`,borderRadius:99,transition:"width .4s ease"}}/>
          </div>
          <div style={{fontSize:12,fontFamily:F.mono,color:C.textTer}}>{voortgang}%</div>
        </div>
      )}

      {klaar && (
        <div style={{background:C.accentBg,border:`1px solid ${C.accent}44`,borderRadius:14,padding:"20px",marginBottom:20}}>
          <div style={{fontSize:22,marginBottom:10}}>✅</div>
          <div style={{fontSize:16,fontWeight:700,color:C.accent,marginBottom:4,fontFamily:F.sans}}>Rapport gegenereerd</div>
          <div style={{fontSize:12,color:C.accent,marginBottom:14,fontFamily:F.sans}}>Trace-ID: AF-2026-0401-OT-001 · 18 pagina's · NLPensioen B.V. huisstijl</div>
          <div style={{display:"flex",gap:8}}>
            <button style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${C.accent}`,background:"transparent",color:C.accent,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F.sans}}>
              📄 Downloaden (.docx)
            </button>
            <button style={{padding:"8px 16px",borderRadius:8,border:"none",background:C.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F.sans}}>
              📤 Beveiligde link sturen
            </button>
          </div>
        </div>
      )}

      {!genereren && !klaar && (
        <button onClick={startGenereren}
          style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.accent},#15795b)`,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F.sans,boxShadow:`0 0 24px ${C.accent}33`}}>
          Rapport genereren →
        </button>
      )}

      {klaar && (
        <button onClick={onVolgende}
          style={{width:"100%",marginTop:12,padding:"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.accent},#15795b)`,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F.sans,boxShadow:`0 0 24px ${C.accent}33`}}>
          Werknemersportaal activeren →
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STAP 4 — WERKNEMERSPORTAAL PREVIEW
// ─────────────────────────────────────────────────────────────────
function StapPortaal({ onVolgende }) {
  const [portaalTab, setPortaalTab] = useState("dashboard");
  const [instemming, setInstemming] = useState(false);

  const wn = { naam:"H. van Dijk", leeftijd:48, salaris:62000, uitvoerder:"Nationale-Nederlanden",
    urm:{ p5:1380, p50:1890, p95:2640 }, aow:1400 };
  const doelMaand = (wn.salaris/12)*0.70;

  const grafData = [
    {sc:"Slecht",  aow:wn.aow, pensioen:wn.urm.p5,  kleur:C.danger},
    {sc:"Verwacht",aow:wn.aow, pensioen:wn.urm.p50, kleur:C.warn},
    {sc:"Goed",    aow:wn.aow, pensioen:wn.urm.p95, kleur:C.accent},
  ];

  return (
    <div style={{maxWidth:760,margin:"0 auto"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8,fontFamily:F.sans}}>Stap 5 van 5</div>
        <h1 style={{fontSize:28,fontWeight:700,color:C.text,margin:"0 0 4px",fontFamily:F.sans}}>Werknemersportaal</h1>
        <p style={{fontSize:13,color:C.textSec,margin:0}}>White-label portaal per werknemer — magic link, geen account nodig. Zo ervaart H. van Dijk het.</p>
      </div>

      {/* Portaal frame */}
      <div style={{background:"#f7f6f3",borderRadius:16,overflow:"hidden",border:`1px solid rgba(0,0,0,0.12)`,boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
        {/* Portaal nav */}
        <div style={{background:"#fff",borderBottom:"1px solid rgba(0,0,0,0.08)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:C.accent}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#0f0f0e",fontFamily:F.sans}}>Mijn Pensioen · NLPensioen B.V.</span>
          </div>
          <span style={{fontSize:12,fontWeight:500,color:"#0f0f0e",fontFamily:F.sans}}>{wn.naam}</span>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid rgba(0,0,0,0.06)",background:"#fff"}}>
          {[["dashboard","🏠 Dashboard"],["pensioen","📊 Pensioen"],["instemmen","✍️ Instemmen"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPortaalTab(k)}
              style={{padding:"9px 14px",border:"none",borderBottom:portaalTab===k?"2px solid #1d9e75":"2px solid transparent",background:"transparent",fontSize:11,fontWeight:portaalTab===k?600:400,color:portaalTab===k?"#1d9e75":"rgba(15,15,14,0.55)",cursor:"pointer",fontFamily:F.sans}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:20,minHeight:320}}>
          {portaalTab==="dashboard"&&(
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#0f0f0e",marginBottom:14,fontFamily:F.sans}}>Goedemiddag, Henk 👋</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[[eur(wn.salaris)+"/jr","Bruto salaris"],[`${wn.leeftijd} jaar`,"Leeftijd"],["20%","Premie van grondslag"],["Nationale-Nederlanden","Uitvoerder"]].map(([v,l])=>(
                  <div key={l} style={{background:"#fff",border:"0.5px solid rgba(0,0,0,0.08)",borderRadius:9,padding:"10px 12px"}}>
                    <div style={{fontSize:9,color:"rgba(15,15,14,0.38)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:2,fontFamily:F.sans}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#0f0f0e",fontFamily:F.mono}}>{v}</div>
                  </div>
                ))}
              </div>
              {!instemming&&(
                <div style={{background:"#faeeda",border:"0.5px solid #ef9f2744",borderRadius:9,padding:"11px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#854f0b",fontFamily:F.sans}}>✍️ Uw instemming is vereist</div>
                    <div style={{fontSize:11,color:"#854f0b",marginTop:2,fontFamily:F.sans}}>Bekijk het was-wordt overzicht en geef uw instemming</div>
                  </div>
                  <button onClick={()=>setPortaalTab("instemmen")} style={{padding:"6px 12px",borderRadius:7,border:"none",background:"#ef9f27",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F.sans}}>Naar instemming →</button>
                </div>
              )}
              {instemming&&(
                <div style={{background:"#e0f2ee",border:"0.5px solid #1d9e7544",borderRadius:9,padding:"11px 13px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#1d9e75",fontFamily:F.sans}}>✓ Ingestemd op {new Date().toLocaleDateString("nl-NL")}</div>
                </div>
              )}
            </div>
          )}

          {portaalTab==="pensioen"&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#0f0f0e",marginBottom:12,fontFamily:F.sans}}>Uw verwachte pensioen</div>
              <div style={{height:170}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={grafData} barSize={52} margin={{top:4,right:8,bottom:0,left:8}}>
                    <XAxis dataKey="sc" tick={{fill:"rgba(15,15,14,0.55)",fontSize:10,fontFamily:F.sans}} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={v=>eur(v)} tick={{fill:"rgba(15,15,14,0.38)",fontSize:8,fontFamily:F.mono}} axisLine={false} tickLine={false} width={52}/>
                    <Bar dataKey="aow" stackId="a" fill="#94a3b8" fillOpacity={0.6}/>
                    <Bar dataKey="pensioen" stackId="a" radius={[4,4,0,0]}>{grafData.map((g,i)=><Cell key={i} fill={g.kleur}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:"#e0f2ee",border:"0.5px solid #1d9e7544",borderRadius:8,padding:"9px 12px",marginTop:10,display:"flex",justifyContent:"space-between"}}>
                <div style={{fontSize:11,color:"#1d9e75",fontFamily:F.sans}}>Verwacht pensioen (P50) incl. AOW</div>
                <div style={{fontSize:14,fontWeight:700,color:"#1d9e75",fontFamily:F.mono}}>{eur(wn.aow+wn.urm.p50)}/mnd</div>
              </div>
            </div>
          )}

          {portaalTab==="instemmen"&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#0f0f0e",marginBottom:14,fontFamily:F.sans}}>Was-wordt overzicht</div>
              <div style={{background:"#fff",border:"0.5px solid rgba(0,0,0,0.08)",borderRadius:9,overflow:"hidden",marginBottom:14}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"#f7f6f3"}}>
                    {["","Huidige regeling","Nieuwe regeling"].map(h=><th key={h} style={{padding:"7px 11px",textAlign:"left",fontSize:9,fontWeight:700,color:"rgba(15,15,14,0.38)",textTransform:"uppercase",letterSpacing:".06em",fontFamily:F.sans}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {[["Type","Staffel (DB)","Beschikbare premie (DC)"],["Premie","4,8%–22,9%","20% vlak"],["Uitvoerder","ASR","Nationale-Nederlanden"],["Verwacht pensioen P50",eur(1890)+"/mnd",eur(wn.aow+wn.urm.p50)+"/mnd incl. AOW"]].map(([k,o,n],i)=>(
                      <tr key={k} style={{background:i%2===0?"#fff":"#f7f6f3"}}>
                        <td style={{padding:"7px 11px",fontSize:11,color:"rgba(15,15,14,0.55)",fontFamily:F.sans}}>{k}</td>
                        <td style={{padding:"7px 11px",fontSize:11,color:"rgba(15,15,14,0.38)",fontFamily:F.mono}}>{o}</td>
                        <td style={{padding:"7px 11px",fontSize:11,fontWeight:600,color:"#1d9e75",fontFamily:F.mono}}>{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!instemming?(
                <button onClick={()=>{setInstemming(true);setPortaalTab("dashboard");}}
                  style={{width:"100%",padding:"12px",borderRadius:9,border:"none",background:"#1d9e75",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F.sans}}>
                  ✍️ Ik ga akkoord met de pensioenwijziging
                </button>
              ):(
                <div style={{textAlign:"center",padding:"14px",color:"#1d9e75",fontSize:13,fontWeight:600,fontFamily:F.sans}}>✓ Ingestemd</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:20,background:C.accentBg,border:`1px solid ${C.accent}33`,borderRadius:12,padding:"14px 16px"}}>
        <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:6,fontFamily:F.sans}}>✓ Zo werkt het voor de werkgever</div>
        <div style={{display:"flex",gap:14,fontSize:12,color:C.accent,fontFamily:F.sans,flexWrap:"wrap"}}>
          <span>45 werknemers ontvangen een persoonlijke magic link</span>
          <span>·</span>
          <span>Geen account nodig</span>
          <span>·</span>
          <span>Instemming met tijdstempel + IP vastgelegd</span>
          <span>·</span>
          <span>Adviseur ziet live status per werknemer</span>
        </div>
      </div>

      <button onClick={onVolgende} style={{width:"100%",marginTop:12,padding:"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.gold},#c8960a)`,color:"#0f0f0e",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F.sans,boxShadow:`0 0 32px ${C.gold}44`}}>
        Samenvatting bekijken →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// EINDSCHERM — INVESTERINGSCASE
// ─────────────────────────────────────────────────────────────────
function EindScherm({ onOpnieuw }) {
  return (
    <div style={{maxWidth:680,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>🎯</div>
      <h1 style={{fontSize:32,fontWeight:700,color:C.text,margin:"0 0 8px",fontFamily:F.sans}}>AdviesFocus in 20 minuten</h1>
      <p style={{fontSize:15,color:C.textSec,marginBottom:32,lineHeight:1.7}}>Van klantprofiel tot werknemersinstemming — compleet AFM-compliant, volledig geïntegreerd.</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32,textAlign:"left"}}>
        {[
          ["📋","Wft-compliant inventarisatie","4 modules, BPF-check, CAO-koppeling, volledig gedocumenteerd"],
          ["📊","Live rekenmodule","DNB URM 2026Q1 — P5/P50/P95 per werknemer, vlakke premie vs. staffel"],
          ["⚖️","Productvergelijking","NN, ASR, BeFrank, Aegon — echte marktdata, scoremodel, AFM-bewijs"],
          ["📄","Word-adviesrapport","12 hoofdstukken, deterministisch, huisstijl, trace-ID, direct te versturen"],
          ["👤","Werknemersportaal","Magic link, URM-visualisatie, digitale instemming met audit-trail"],
          ["🔔","Actief beheer","Mutatie-import, alert-dashboard, deadline tracker, OR-module"],
        ].map(([icon,titel,sub])=>(
          <div key={titel} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px"}}>
            <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:3,fontFamily:F.sans}}>{titel}</div>
            <div style={{fontSize:11,color:C.textSec,lineHeight:1.5,fontFamily:F.sans}}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{background:C.goldBg,border:`1px solid ${C.gold}44`,borderRadius:14,padding:"20px",marginBottom:24}}>
        <div style={{fontSize:13,fontWeight:700,color:C.gold,marginBottom:12,fontFamily:F.sans}}>De marktopportuniteit</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[["~57.000","pensioencontracten nog over te zetten"],["~1.200","onafhankelijke pensioenadviseurs"],["Geen","geïntegreerd platform beschikbaar"]].map(([v,l])=>(
            <div key={l}>
              <div style={{fontSize:22,fontWeight:700,color:C.gold,fontFamily:F.mono}}>{v}</div>
              <div style={{fontSize:11,color:C.warn,fontFamily:F.sans,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onOpnieuw}
        style={{padding:"12px 32px",borderRadius:12,border:`1px solid ${C.border}`,background:"transparent",color:C.textSec,fontSize:13,cursor:"pointer",fontFamily:F.sans}}>
        ↺ Demo opnieuw starten
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────
export default function AdviesFocusDemo() {
  const [stap, setStap] = useState(-1); // -1 = landing

  useEffect(() => {
    if (!document.getElementById("af-fonts")) {
      const l = document.createElement("link");
      l.id = "af-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:F.sans,position:"relative",overflow:"hidden"}}>
      {/* Ambient glows */}
      <Glow kleur={C.accent} size={500} x="10%" y="15%" opacity={0.06}/>
      <Glow kleur="#5b4fcf"  size={400} x="85%" y="70%" opacity={0.05}/>

      {/* Header */}
      <div style={{padding:"16px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,backdropFilter:"blur(10px)",position:"sticky",top:0,zIndex:100,background:"rgba(15,15,14,0.85)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {/* Logo */}
          <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="22" height="22" rx="5" fill={C.accent}/>
            <rect x="14" y="14" width="22" height="22" rx="5" fill="none" stroke={C.accent} strokeWidth="1.5" strokeOpacity=".5"/>
            <rect x="16" y="16" width="8" height="8" rx="2" fill="#fff"/>
          </svg>
          <span style={{fontSize:16,letterSpacing:"-.03em"}}>
            <span style={{fontWeight:300,color:C.textSec}}>Advies</span>
            <span style={{fontWeight:700,color:C.text}}>Focus</span>
          </span>
          {stap >= 0 && stap < 5 && (
            <>
              <div style={{width:1,height:16,background:C.border,margin:"0 4px"}}/>
              <Tag>Live demo</Tag>
            </>
          )}
        </div>
        {stap >= 0 && stap < 5 && <StapIndicator actief={stap}/>}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:C.textTer}}>NLPensioen B.V.</span>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.accentBg,border:`1px solid ${C.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.accent}}>DW</div>
        </div>
      </div>

      {/* Landing */}
      {stap === -1 && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 61px)",padding:"40px 24px",textAlign:"center"}}>
          <div style={{marginBottom:12}}>
            <Tag kleur={C.gold} bg={C.goldBg}>Versie 5.0 · Demo · April 2026</Tag>
          </div>
          <h1 style={{fontSize:48,fontWeight:800,color:C.text,margin:"0 0 14px",maxWidth:640,lineHeight:1.1,letterSpacing:"-.02em"}}>
            Het eerste integrale platform voor pensioenadviseurs
          </h1>
          <p style={{fontSize:17,color:C.textSec,maxWidth:520,margin:"0 0 36px",lineHeight:1.7}}>
            Van Wft-inventarisatie tot werknemer-instemming — in één platform. Gebouwd voor de Wet toekomst pensioenen.
          </p>

          <div style={{display:"flex",gap:10,marginBottom:48}}>
            <button onClick={()=>setStap(0)}
              style={{padding:"14px 32px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${C.accent},#15795b)`,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:F.sans,boxShadow:`0 0 40px ${C.accent}44`,letterSpacing:".01em"}}>
              Demo starten →
            </button>
            <button style={{padding:"14px 24px",borderRadius:12,border:`1px solid ${C.border}`,background:"transparent",color:C.textSec,fontSize:14,cursor:"pointer",fontFamily:F.sans}}>
              Meer informatie
            </button>
          </div>

          {/* Drie USPs */}
          <div style={{display:"flex",gap:12,maxWidth:760}}>
            {[
              [C.accent, "Wft-compliant",     "Inventarisatie → analyse → adviesrapport conform AFM-vereisten"],
              [C.gold,   "Live rekenmodule",   "DNB URM 2026Q1 volledig ingeladen — echte scenario's, echte getallen"],
              [C.blue,   "Werknemersportaal",  "Magic link, geen account, digitale instemming met volledige audit-trail"],
            ].map(([kleur,titel,sub])=>(
              <div key={titel} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px",textAlign:"left"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:kleur,marginBottom:10}}/>
                <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4,fontFamily:F.sans}}>{titel}</div>
                <div style={{fontSize:11,color:C.textSec,lineHeight:1.5,fontFamily:F.sans}}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo stappen */}
      <div style={{padding:"40px 28px",display:stap>=0&&stap<=4?"block":"none"}}>
        {stap===0&&<StapKlant     onVolgende={()=>setStap(1)}/>}
        {stap===1&&<StapTransitie onVolgende={()=>setStap(2)}/>}
        {stap===2&&<StapVergelijking onVolgende={()=>setStap(3)}/>}
        {stap===3&&<StapRapport   onVolgende={()=>setStap(4)}/>}
        {stap===4&&<StapPortaal   onVolgende={()=>setStap(5)}/>}
      </div>

      {stap===5&&(
        <div style={{padding:"40px 28px"}}>
          <EindScherm onOpnieuw={()=>setStap(-1)}/>
        </div>
      )}
    </div>
  );
}
