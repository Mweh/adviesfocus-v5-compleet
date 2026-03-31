import { useState, useMemo, useRef, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

// ══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════
const T = {
  bg:"#f7f6f3", bgCard:"#ffffff", bgSec:"#f1efe8",
  border:"rgba(15,15,14,0.10)", borderSec:"rgba(15,15,14,0.06)",
  text:"#0f0f0e", textSec:"rgba(15,15,14,0.55)", textTer:"rgba(15,15,14,0.38)",
  accent:"#1d9e75", accentBg:"#e0f2ee",
  warn:"#ef9f27", warnBg:"#faeeda", warnText:"#854f0b",
  danger:"#e24b4a", dangerBg:"#fcebeb", dangerText:"#a32d2d",
  blue:"#185fa5", blueBg:"#e6f1fb",
  purple:"#5b4fcf", purpleBg:"#edeaf8",
  aow:"#94a3b8",
  font:"'DM Sans', system-ui, sans-serif",
  mono:"'DM Mono', monospace",
};

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
const eur = n => new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n??0);
function eurC(n){const v=n??0;if(v>=1e6)return`€\u00a0${(v/1e6).toLocaleString("nl-NL",{minimumFractionDigits:1,maximumFractionDigits:2})}\u00a0mln`;if(v>=1e3)return`€\u00a0${(v/1e3).toLocaleString("nl-NL",{minimumFractionDigits:0,maximumFractionDigits:1})}\u00a0k`;return eur(v);}
const pct = n => `${n}%`;
const datNL = s => new Date(s).toLocaleDateString("nl-NL",{day:"2-digit",month:"short",year:"numeric"});
const kb = n => n>1048576?`${(n/1048576).toFixed(1)} MB`:`${Math.round(n/1024)} KB`;
const maandUit = (k,r=0.02,jr=20)=>{const rm=r/12,n=jr*12;return k*(rm*(1+rm)**n)/((1+rm)**n-1);};

function Pill({label,kleur,bg,small}){return <span style={{fontSize:small?9:10,fontWeight:600,color:kleur,background:bg,padding:small?"1px 6px":"2px 8px",borderRadius:99,fontFamily:T.font,textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{label}</span>;}
function Card({children,style={}}){return <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,...style}}>{children}</div>;}
function Sectie({title,sub,children,accent}){return<Card style={{marginBottom:14,overflow:"hidden"}}><div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:accent?`${accent}08`:T.bgSec}}><div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>{title}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:2,fontFamily:T.font}}>{sub}</div>}</div><div style={{padding:"14px 16px"}}>{children}</div></Card>;}

// ══════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════
const KLANT = { naam:"Oranje Techniek B.V.", kvk:"12345678", adviseur:"D. Wietzema Menkhorst", kantoor:"Pensioenadvies Menkhorst B.V.", accent:"#1d9e75" };

const WERKNEMERS_HUIDIG = [
  {id:"w1",naam:"A. de Vries",    leeftijd:45,salaris:62000,parttimePerc:100,dienstjaren:18,email:"a.devries@oranjetechniek.nl",  instemming:"ingestemd",portaalGeopend:true},
  {id:"w2",naam:"B. Janssen",     leeftijd:38,salaris:44500,parttimePerc:80, dienstjaren:12,email:"b.janssen@oranjetechniek.nl",   instemming:"verstuurd",portaalGeopend:true},
  {id:"w3",naam:"C. Peters",      leeftijd:52,salaris:71000,parttimePerc:100,dienstjaren:22,email:"c.peters@oranjetechniek.nl",    instemming:"niet_verstuurd",portaalGeopend:false},
  {id:"w4",naam:"D. Bakker",      leeftijd:29,salaris:38000,parttimePerc:100,dienstjaren:4, email:"d.bakker@oranjetechniek.nl",    instemming:"bezwaar",portaalGeopend:true},
  {id:"w5",naam:"E. Visser",      leeftijd:61,salaris:88000,parttimePerc:100,dienstjaren:31,email:"e.visser@oranjetechniek.nl",    instemming:"ingestemd",portaalGeopend:true},
  {id:"w6",naam:"F. de Boer",     leeftijd:34,salaris:42000,parttimePerc:60, dienstjaren:7, email:"f.deboer@oranjetechniek.nl",    instemming:"verstuurd",portaalGeopend:false},
];

const MOCK_ALERTS = [
  {id:"a1",type:"budget",prioriteit:"hoog",  titel:"Pensioenlasten overschrijden budget",  tekst:"Na salarisronde stijgen de pensioenlasten naar €243.000/jr — 4,8% boven het vastgestelde budget van €232.000.", klant:"Oranje Techniek B.V.", datum:"2026-03-27", status:"open",   werknemer:null},
  {id:"a2",type:"trigger",prioriteit:"middel",titel:"5 jaar voor pensioen — E. Visser",    tekst:"E. Visser (61 jr) bereikt de pensioenleeftijd over 6 jaar. Overweeg een lifecycle-review en communicatie.", klant:"Oranje Techniek B.V.", datum:"2026-03-25", status:"open",  werknemer:"E. Visser"},
  {id:"a3",type:"mutatie",prioriteit:"laag",  titel:"3 mutaties klaarstaan voor review",   tekst:"Salarisupload van 28 mrt bevat 3 wijzigingen: 2 salarisverhogingen, 1 nieuwe medewerker.", klant:"Oranje Techniek B.V.", datum:"2026-03-28", status:"open",   werknemer:null},
  {id:"a4",type:"instemming",prioriteit:"middel",titel:"D. Bakker heeft bezwaar ingediend",tekst:"D. Bakker (29 jr) heeft het instemmingsformulier teruggestuurd met bezwaar. Actie vereist.", klant:"Oranje Techniek B.V.", datum:"2026-03-26", status:"open",   werknemer:"D. Bakker"},
  {id:"a5",type:"cao",prioriteit:"laag",     titel:"CAO Metaal & Techniek — update check", tekst:"De CAO Metaal & Techniek loopt af op 1 juni 2026. Controleer of nieuwe parameters invloed hebben op de regeling.", klant:"Oranje Techniek B.V.", datum:"2026-03-20", status:"afgehandeld", werknemer:null},
];

const DEMO_WERKNEMER = {
  naam:"H. van Dijk", leeftijd:48, salaris:62000, franchise:17545, premiePerc:20,
  aanbieder:"Nationale-Nederlanden", lifecycle:"Neutraal", equityPct:52,
  aow:1400, urm:{p5:1180,p50:1640,p95:2290}, doelPct:70,
  documenten:[
    {naam:"Was-wordt brief", datum:"2026-03-25", gelezen:true},
    {naam:"Pensioenbrief Q1 2026", datum:"2026-03-20", gelezen:true},
    {naam:"UPO 2025", datum:"2026-01-15", gelezen:false},
  ],
  instemming:{status:"nog_niet",tijdstempel:null,ip:null},
};

// ══════════════════════════════════════════════════════════════════
// CSV DIFF ENGINE
// ══════════════════════════════════════════════════════════════════
const CSV_NIEUW = [
  {id:"w1",naam:"A. de Vries",    leeftijd:45,salaris:65000,parttimePerc:100},  // salaris +3000
  {id:"w2",naam:"B. Janssen",     leeftijd:38,salaris:44500,parttimePerc:80},   // geen wijziging
  {id:"w3",naam:"C. Peters",      leeftijd:52,salaris:71000,parttimePerc:100},
  {id:"w4",naam:"D. Bakker",      leeftijd:29,salaris:38000,parttimePerc:100},
  {id:"w5",naam:"E. Visser",      leeftijd:61,salaris:88000,parttimePerc:100},
  {id:"w6",naam:"F. de Boer",     leeftijd:34,salaris:42000,parttimePerc:60},
  {id:"w7",naam:"G. Meijer",      leeftijd:26,salaris:32000,parttimePerc:100},  // NIEUW
];

function berekenDiff(oud, nieuw){
  const oudMap = Object.fromEntries(oud.map(w=>[w.id,w]));
  const nieuwMap = Object.fromEntries(nieuw.map(w=>[w.id,w]));
  const resultaat=[];
  nieuw.forEach(w=>{
    if(!oudMap[w.id]){resultaat.push({...w,type:"nieuw",wijzigingen:[]});return;}
    const o=oudMap[w.id];const wij=[];
    if(o.salaris!==w.salaris) wij.push({veld:"salaris",oud:o.salaris,nieuw:w.salaris});
    if(o.parttimePerc!==w.parttimePerc) wij.push({veld:"parttime%",oud:o.parttimePerc,nieuw:w.parttimePerc});
    if(wij.length) resultaat.push({...w,type:"gewijzigd",wijzigingen:wij});
  });
  oud.forEach(w=>{if(!nieuwMap[w.id])resultaat.push({...w,type:"uitdienst",wijzigingen:[]});});
  return resultaat;
}

const DIFF = berekenDiff(WERKNEMERS_HUIDIG.map(w=>({id:w.id,naam:w.naam,leeftijd:w.leeftijd,salaris:w.salaris,parttimePerc:w.parttimePerc})), CSV_NIEUW);

// ══════════════════════════════════════════════════════════════════
// 3.1 ALERT DASHBOARD
// ══════════════════════════════════════════════════════════════════
function AlertDashboard({onNaarMutatie}){
  const [alerts,setAlerts]=useState(MOCK_ALERTS);
  const [filter,setFilter]=useState("open");

  const afhandelen=id=>setAlerts(p=>p.map(a=>a.id===id?{...a,status:"afgehandeld"}:a));
  const gefilterd=alerts.filter(a=>filter==="alle"?true:a.status===filter);

  const alertKleur={hoog:{k:T.dangerText,bg:T.dangerBg},middel:{k:T.warnText,bg:T.warnBg},laag:{k:T.blue,bg:T.blueBg}};
  const alertIcon={budget:"💰",trigger:"⏰",mutatie:"👥",instemming:"✍️",cao:"📋"};

  const openTotaal=alerts.filter(a=>a.status==="open").length;
  const hoogTotaal=alerts.filter(a=>a.status==="open"&&a.prioriteit==="hoog").length;

  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Actief beheer & signalering</h2>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Oranje Techniek B.V. — automatische monitoring en alerts</p>
        </div>
        <button onClick={onNaarMutatie} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:`1px solid ${T.accent}`,background:T.accentBg,color:T.accent,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
          👥 Mutatie-import
        </button>
      </div>

      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[[`${openTotaal}`, "Openstaande alerts", T.text, T.bgCard],[`${hoogTotaal}`,"Hoge prioriteit",T.dangerText,T.dangerBg],["45","Werknemers actief",T.accent,T.accentBg],["3","Acties vereist",T.warnText,T.warnBg]].map(([v,l,k,b])=>(
          <div key={l} style={{background:b,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"10px 14px"}}>
            <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3,fontFamily:T.font}}>{l}</div>
            <div style={{fontSize:24,fontWeight:700,color:k,fontFamily:T.mono}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[["open","Openstaand"],["afgehandeld","Afgehandeld"],["alle","Alle"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${filter===k?T.accent:T.border}`,background:filter===k?T.accentBg:T.bgSec,color:filter===k?T.accent:T.textSec,fontSize:12,cursor:"pointer",fontFamily:T.font,fontWeight:filter===k?600:400}}>
            {l}
          </button>
        ))}
      </div>

      {/* Alert lijst */}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {gefilterd.map(a=>{
          const pr=alertKleur[a.prioriteit];
          const afg=a.status==="afgehandeld";
          return(
            <div key={a.id} style={{background:T.bgCard,border:`0.5px solid ${afg?T.borderSec:T.border}`,borderRadius:10,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start",opacity:afg?0.6:1}}>
              <div style={{width:36,height:36,borderRadius:9,background:pr.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{alertIcon[a.type]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:600,color:afg?T.textTer:T.text,fontFamily:T.font}}>{a.titel}</span>
                  <Pill label={a.prioriteit} kleur={pr.k} bg={pr.bg} small />
                  {a.werknemer&&<Pill label={a.werknemer} kleur={T.blue} bg={T.blueBg} small />}
                </div>
                <div style={{fontSize:12,color:T.textSec,fontFamily:T.font,lineHeight:1.5}}>{a.tekst}</div>
                <div style={{fontSize:10,color:T.textTer,marginTop:4,fontFamily:T.font}}>{datNL(a.datum)}</div>
              </div>
              {!afg&&(
                <button onClick={()=>afhandelen(a.id)} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec,whiteSpace:"nowrap",flexShrink:0}}>
                  ✓ Afhandelen
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MUTATIE-IMPORT
// ══════════════════════════════════════════════════════════════════
function MutatieImport({onTerug}){
  const [fase,setFase]=useState("diff"); // diff | verwerkt
  const [goedgekeurd,setGoedgekeurd]=useState({});

  const toggleGoed=(id)=>setGoedgekeurd(p=>({...p,[id]:!p[id]}));
  const allesGoedkeuren=()=>{const g={};DIFF.forEach(d=>g[d.id]=true);setGoedgekeurd(g);};

  const goedgekeurdeCount=Object.values(goedgekeurd).filter(Boolean).length;

  const typeKleur={nieuw:{k:T.accent,bg:T.accentBg,l:"Nieuw"},gewijzigd:{k:T.warn,bg:T.warnBg,l:"Gewijzigd"},uitdienst:{k:T.dangerText,bg:T.dangerBg,l:"Uitdienst"}};

  if(fase==="verwerkt") return(
    <div style={{textAlign:"center",padding:"48px 0"}}>
      <div style={{fontSize:42,marginBottom:14}}>✅</div>
      <h3 style={{color:T.text,fontFamily:T.font,marginBottom:6}}>Mutaties verwerkt</h3>
      <p style={{color:T.textSec,fontFamily:T.font}}>{goedgekeurdeCount} wijzigingen doorgevoerd. Pensioengrondslag automatisch herberekend.</p>
      <button onClick={onTerug} style={{marginTop:16,padding:"8px 18px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>← Terug naar dashboard</button>
    </div>
  );

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Mutatie-import — review</h2>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Upload van 28 mrt 2026 — {DIFF.length} wijzigingen gevonden</p>
        </div>
        <button onClick={onTerug} style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:12,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>← Terug</button>
      </div>

      {/* Samenvatting */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {Object.entries(typeKleur).map(([type,{k,bg,l}])=>{
          const n=DIFF.filter(d=>d.type===type).length;
          return n>0&&<div key={type} style={{background:bg,border:`0.5px solid ${k}44`,borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13,fontWeight:700,fontFamily:T.mono,color:k}}>{n}</span>
            <span style={{fontSize:11,color:k,fontFamily:T.font}}>{l}</span>
          </div>;
        })}
        <button onClick={allesGoedkeuren} style={{marginLeft:"auto",padding:"6px 12px",borderRadius:7,border:`1px solid ${T.accent}`,background:T.accentBg,color:T.accent,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
          Alles goedkeuren
        </button>
      </div>

      {/* Diff tabel */}
      <Card style={{overflow:"hidden",marginBottom:14}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.bgSec}}>
            {["","Naam","Type","Wijziging","Pensioengrondslag","Goedkeuren"].map(h=>(
              <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {DIFF.map((d,i)=>{
              const {k,bg,l}=typeKleur[d.type];
              const grondslag=Math.max(0,d.salaris-17545)*(d.parttimePerc/100);
              return(
                <tr key={d.id} style={{background:i%2===0?T.bgCard:T.bgSec}}>
                  <td style={{padding:"8px 12px"}}><Pill label={l} kleur={k} bg={bg} small /></td>
                  <td style={{padding:"8px 12px",fontSize:12,fontFamily:T.font,color:T.text,fontWeight:500}}>{d.naam}</td>
                  <td style={{padding:"8px 12px",fontSize:11,fontFamily:T.font,color:T.textSec}}>{d.type==="nieuw"?"Indiensttreding":d.type==="uitdienst"?"Uitdienst":"—"}</td>
                  <td style={{padding:"8px 12px"}}>
                    {d.wijzigingen.map(w=>(
                      <div key={w.veld} style={{fontSize:11,fontFamily:T.mono,color:T.text}}>
                        {w.veld}: <span style={{color:T.dangerText,textDecoration:"line-through"}}>{typeof w.oud==="number"?eur(w.oud):w.oud}</span>
                        {" → "}<span style={{color:T.accent,fontWeight:600}}>{typeof w.nieuw==="number"?eur(w.nieuw):w.nieuw}</span>
                      </div>
                    ))}
                    {d.type==="nieuw"&&<span style={{fontSize:11,color:T.accent,fontFamily:T.font}}>Nieuw — {eur(d.salaris)}/jr</span>}
                    {d.type==="uitdienst"&&<span style={{fontSize:11,color:T.dangerText,fontFamily:T.font}}>Uit dienst</span>}
                    {d.type==="gewijzigd"&&d.wijzigingen.length===0&&<span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>Geen wijziging</span>}
                  </td>
                  <td style={{padding:"8px 12px",fontSize:12,fontFamily:T.mono,color:T.textSec}}>{d.type!=="uitdienst"?eurC(grondslag):"-"}</td>
                  <td style={{padding:"8px 12px"}}>
                    <button onClick={()=>toggleGoed(d.id)}
                      style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${goedgekeurd[d.id]?T.accent:T.border}`,background:goedgekeurd[d.id]?T.accent:T.bgSec,color:goedgekeurd[d.id]?"#fff":T.textSec,fontSize:11,cursor:"pointer",fontFamily:T.font,fontWeight:goedgekeurd[d.id]?600:400}}>
                      {goedgekeurd[d.id]?"✓ Goedgekeurd":"Goedkeuren"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>{goedgekeurdeCount} van {DIFF.length} goedgekeurd</span>
        <button onClick={()=>goedgekeurdeCount>0&&setFase("verwerkt")} disabled={goedgekeurdeCount===0}
          style={{padding:"9px 20px",borderRadius:8,border:"none",background:goedgekeurdeCount>0?T.accent:T.border,color:"#fff",fontSize:13,fontWeight:600,cursor:goedgekeurdeCount>0?"pointer":"not-allowed",fontFamily:T.font}}>
          {goedgekeurdeCount} mutaties doorvoeren →
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// INSTEMMING DASHBOARD (adviseur)
// ══════════════════════════════════════════════════════════════════
function InstemmingDashboard(){
  const [werknemers,setWerknemers]=useState(WERKNEMERS_HUIDIG);
  const [herinnering,setHerinnering]=useState(null);

  const stuurHerinnering=(id)=>{setHerinnering(id);setTimeout(()=>setHerinnering(null),2500);};

  const statusKleur={ingestemd:{k:T.accent,bg:T.accentBg,l:"✓ Ingestemd"},verstuurd:{k:T.blue,bg:T.blueBg,l:"Verstuurd"},niet_verstuurd:{k:T.textTer,bg:T.bgSec,l:"Niet verstuurd"},bezwaar:{k:T.dangerText,bg:T.dangerBg,l:"⚠ Bezwaar"}};

  const stats={
    ingestemd:werknemers.filter(w=>w.instemming==="ingestemd").length,
    verstuurd:werknemers.filter(w=>w.instemming==="verstuurd").length,
    bezwaar:werknemers.filter(w=>w.instemming==="bezwaar").length,
    niet:werknemers.filter(w=>w.instemming==="niet_verstuurd").length,
  };

  return(
    <Sectie title="Digitale instemming — overzicht" sub={`${werknemers.length} werknemers · ${stats.ingestemd} ingestemd · ${stats.bezwaar} bezwaar`} accent={T.accent}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[[stats.ingestemd,"Ingestemd",T.accent,T.accentBg],[stats.verstuurd,"Verstuurd",T.blue,T.blueBg],[stats.bezwaar,"Bezwaar",T.dangerText,T.dangerBg],[stats.niet,"Niet verstuurd",T.textTer,T.bgSec]].map(([v,l,k,b])=>(
          <div key={l} style={{background:b,border:`0.5px solid ${T.border}`,borderRadius:8,padding:"8px 11px"}}>
            <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2,fontFamily:T.font}}>{l}</div>
            <div style={{fontSize:20,fontWeight:700,color:k,fontFamily:T.mono}}>{v}</div>
          </div>
        ))}
      </div>

      {herinnering&&<div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:7,padding:"7px 11px",marginBottom:10,fontSize:12,color:T.accent,fontFamily:T.font}}>✓ Herinnering verstuurd naar {werknemers.find(w=>w.id===herinnering)?.naam}</div>}

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {werknemers.map(w=>{
          const s=statusKleur[w.instemming];
          return(
            <div key={w.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:T.bgSec,borderRadius:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{w.naam}</div>
                <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{w.email}</div>
              </div>
              <div style={{fontSize:10,color:T.textTer,fontFamily:T.font,textAlign:"right"}}>
                {w.portaalGeopend?"Portaal geopend":"Portaal niet geopend"}
              </div>
              <Pill label={s.l} kleur={s.k} bg={s.bg} small />
              {(w.instemming==="verstuurd"||w.instemming==="niet_verstuurd")&&(
                <button onClick={()=>stuurHerinnering(w.id)} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgCard,fontSize:10,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>↺ Herinnering</button>
              )}
            </div>
          );
        })}
      </div>
    </Sectie>
  );
}

// ══════════════════════════════════════════════════════════════════
// WERKNEMERSPORTAAL
// ══════════════════════════════════════════════════════════════════
function WerknemersPortaal(){
  const wn=DEMO_WERKNEMER;
  const [portaalTab,setPortaalTab]=useState("dashboard");
  const [instemming,setInstemming]=useState(wn.instemming);
  const [vraag,setVraag]=useState("");
  const [vraagVerstuurd,setVraagVerstuurd]=useState(false);
  const [showInstemmingModal,setShowInstemmingModal]=useState(false);

  const grondslag=Math.max(0,wn.salaris-wn.franchise);
  const jaarInleg=grondslag*(wn.premiePerc/100);
  const doelMaand=(wn.salaris/12)*(wn.doelPct/100);

  const tabs=[["dashboard","🏠 Dashboard"],["urm","📊 Pensioen"],["documenten","📄 Documenten"],["instemmen","✍️ Instemmen"],["scenario","🧮 Berekenen"]];

  // Portaal header
  const PortaalHeader=()=>(
    <div style={{background:T.bgCard,borderBottom:`1px solid ${T.border}`,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:28,height:28,borderRadius:7,background:T.accentBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🔒</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:T.font}}>Mijn Pensioenportaal</div>
          <div style={{fontSize:10,color:T.textSec,fontFamily:T.font}}>{KLANT.naam} · {KLANT.kantoor}</div>
        </div>
      </div>
      <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{wn.naam}</div>
    </div>
  );

  const PortaalNav=()=>(
    <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`,background:T.bgCard,overflowX:"auto"}}>
      {tabs.map(([k,l])=>(
        <button key={k} onClick={()=>setPortaalTab(k)}
          style={{padding:"10px 14px",border:"none",borderBottom:portaalTab===k?`2px solid ${T.accent}`:"2px solid transparent",background:"transparent",fontSize:12,fontWeight:portaalTab===k?600:400,color:portaalTab===k?T.accent:T.textSec,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>
          {l}
        </button>
      ))}
    </div>
  );

  return(
    <div style={{background:"#f0f0ef",minHeight:500,borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`}}>
      <PortaalHeader/>
      <PortaalNav/>
      <div style={{padding:20}}>

        {/* ── Dashboard ── */}
        {portaalTab==="dashboard"&&(
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:4,fontFamily:T.font}}>Welkom, {wn.naam.split(" ")[0]}</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:16,fontFamily:T.font}}>Uw persoonlijk pensioenoverzicht bij {KLANT.naam}</div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[[`${eur(wn.salaris)}/jr`,"Huidig salaris"],[`${wn.leeftijd} jaar`,"Uw leeftijd"],[`${wn.premiePerc}%`,"Premie van grondslag"],[`${wn.aanbieder}`,"Uitvoerder"]].map(([v,l])=>(
                <div key={l} style={{background:T.bgCard,borderRadius:9,padding:"10px 12px",border:`0.5px solid ${T.border}`}}>
                  <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".04em",marginBottom:2,fontFamily:T.font}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:T.mono}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Instemming status */}
            {instemming.status==="nog_niet"&&(
              <div style={{background:T.warnBg,border:`0.5px solid ${T.warn}44`,borderRadius:10,padding:"12px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:T.warnText,fontFamily:T.font}}>✍️ Uw instemming is vereist</div>
                  <div style={{fontSize:11,color:T.warnText,fontFamily:T.font,marginTop:2}}>Bekijk het was-wordt overzicht en geef uw instemming via het tabblad 'Instemmen'</div>
                </div>
                <button onClick={()=>setPortaalTab("instemmen")} style={{padding:"6px 12px",borderRadius:7,border:"none",background:T.warn,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>Naar instemming →</button>
              </div>
            )}
            {instemming.status==="ingestemd"&&(
              <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:10,padding:"10px 14px",marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:600,color:T.accent,fontFamily:T.font}}>✓ U heeft ingestemd op {datNL(instemming.tijdstempel)}</div>
              </div>
            )}

            {/* Snel naar */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["📊","Mijn pensioen","urm"],["📄","Documenten","documenten"],["🧮","Berekenen","scenario"]].map(([icon,l,tab])=>(
                <button key={tab} onClick={()=>setPortaalTab(tab)} style={{padding:"12px 8px",borderRadius:9,border:`0.5px solid ${T.border}`,background:T.bgCard,cursor:"pointer",fontFamily:T.font,textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                  <div style={{fontSize:11,fontWeight:500,color:T.text}}>{l}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── URM Pensioen ── */}
        {portaalTab==="urm"&&(
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3,fontFamily:T.font}}>Uw verwachte pensioen</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:14,fontFamily:T.font}}>Gebaseerd op DNB URM-scenarioset 2026Q1 · inclusief AOW-indicatie</div>

            {/* Bars */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {[[wn.urm.p5,"Slecht weer",T.dangerText,T.dangerBg],[wn.urm.p50,"Verwacht",T.warn,T.warnBg],[wn.urm.p95,"Goed weer",T.accent,T.accentBg]].map(([v,l,k,b])=>(
                <div key={l} style={{background:b,border:`0.5px solid ${k}44`,borderRadius:10,padding:"12px 13px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:k,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>{l}</div>
                  <div style={{fontSize:10,color:k,fontFamily:T.font,marginBottom:2}}>AOW ~{eur(wn.aow)}</div>
                  <div style={{fontSize:20,fontWeight:700,color:k,fontFamily:T.mono,lineHeight:1.1}}>{eur(wn.aow+v)}</div>
                  <div style={{fontSize:10,color:k,fontFamily:T.font,marginTop:2}}>per maand</div>
                </div>
              ))}
            </div>

            <div style={{background:T.bgCard,borderRadius:9,padding:"10px 13px",border:`0.5px solid ${T.border}`,marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:4,fontFamily:T.font}}>Uw doelstelling</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>{wn.doelPct}% van huidig salaris</div>
                <div style={{fontSize:14,fontWeight:700,fontFamily:T.mono,color:T.text}}>{eur(doelMaand)}/mnd</div>
              </div>
              <div style={{background:T.bgSec,borderRadius:99,height:6,marginTop:6,overflow:"hidden"}}>
                <div style={{width:`${Math.min(100,(wn.aow+wn.urm.p50)/doelMaand*100)}%`,height:"100%",background:T.accent,borderRadius:99}}/>
              </div>
              <div style={{fontSize:10,color:T.textTer,marginTop:3,fontFamily:T.font}}>Verwacht scenario: {Math.round((wn.aow+wn.urm.p50)/doelMaand*100)}% van doelstelling</div>
            </div>

            <div style={{background:T.bgSec,borderRadius:8,padding:"9px 11px",fontSize:11,color:T.textTer,fontFamily:T.font}}>
              💡 Wilt u zien wat extra inleg oplevert? Ga naar het tabblad 'Berekenen'.
            </div>
          </div>
        )}

        {/* ── Documenten ── */}
        {portaalTab==="documenten"&&(
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:12,fontFamily:T.font}}>Uw documenten</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {wn.documenten.map(d=>(
                <div key={d.naam} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.bgCard,borderRadius:9,border:`0.5px solid ${T.border}`}}>
                  <span style={{fontSize:20}}>📄</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{d.naam}</div>
                    <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{datNL(d.datum)}</div>
                  </div>
                  <Pill label={d.gelezen?"✓ Gelezen":"Nieuw"} kleur={d.gelezen?T.accent:T.warnText} bg={d.gelezen?T.accentBg:T.warnBg} small />
                  <button style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>Download</button>
                </div>
              ))}
            </div>

            <div style={{marginTop:14,borderTop:`0.5px solid ${T.border}`,paddingTop:14}}>
              <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:8,fontFamily:T.font}}>Vraag stellen</div>
              <textarea value={vraag} onChange={e=>setVraag(e.target.value)} placeholder="Stel een vraag aan uw adviseur over uw pensioen…" rows={3}
                style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgCard,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
              {vraagVerstuurd&&<div style={{fontSize:11,color:T.accent,marginTop:4,fontFamily:T.font}}>✓ Vraag verstuurd — uw adviseur reageert binnen 2 werkdagen</div>}
              <button onClick={()=>{if(vraag.trim()){setVraagVerstuurd(true);setVraag("");setTimeout(()=>setVraagVerstuurd(false),4000);}}}
                style={{marginTop:8,padding:"7px 14px",borderRadius:7,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
                Vraag versturen
              </button>
            </div>
          </div>
        )}

        {/* ── Instemmen ── */}
        {portaalTab==="instemmen"&&(
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3,fontFamily:T.font}}>Instemming pensioenwijziging</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:14,fontFamily:T.font}}>Bekijk het was-wordt overzicht en geef uw formele instemming</div>

            {/* Was-wordt */}
            <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:10,overflow:"hidden",marginBottom:14}}>
              <div style={{background:T.bgSec,padding:"9px 13px",borderBottom:`0.5px solid ${T.border}`}}>
                <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>Was-wordt overzicht — uw persoonlijke situatie</div>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:"#fafaf8"}}>
                  {["Kenmerk","Huidige regeling","Nieuwe regeling"].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[["Type regeling","Eindloon staffel (DB)","Beschikbare premie (DC)"],["Premie","4,8% – 32,2% (leeftijdsafh.)","20% vlak"],["Uitvoerder","ASR","Nationale-Nederlanden"],["Nabestaanden","ANW-volgend","ANW-volgend"],["Pensioenleeftijd","67 jaar","67 jaar"],["Verwacht pensioen (P50)",`${eur(1890)}/mnd`,`${eur(wn.aow+wn.urm.p50)}/mnd`]].map(([k,o,n],i)=>(
                    <tr key={k} style={{background:i%2===0?T.bgCard:"#fafaf8"}}>
                      <td style={{padding:"7px 12px",fontSize:11,color:T.textSec,fontFamily:T.font}}>{k}</td>
                      <td style={{padding:"7px 12px",fontSize:11,fontFamily:T.mono,color:T.textTer}}>{o}</td>
                      <td style={{padding:"7px 12px",fontSize:11,fontFamily:T.mono,color:T.accent,fontWeight:600}}>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {instemming.status==="ingestemd"?(
              <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
                <div style={{fontSize:16,marginBottom:6}}>✅</div>
                <div style={{fontSize:13,fontWeight:600,color:T.accent,fontFamily:T.font}}>U heeft ingestemd op {datNL(instemming.tijdstempel)}</div>
                <div style={{fontSize:11,color:T.accent,marginTop:3,fontFamily:T.font}}>Uw digitale handtekening is geregistreerd in het dossier</div>
              </div>
            ):(
              <div>
                <div style={{background:T.warnBg,border:`0.5px solid ${T.warn}44`,borderRadius:9,padding:"10px 13px",marginBottom:12,fontSize:11,color:T.warnText,fontFamily:T.font}}>
                  ⚠ Door op 'Instemmen' te klikken bevestigt u dat u het was-wordt overzicht heeft gelezen en akkoord gaat met de pensioenwijziging. Uw naam, tijdstempel en IP-adres worden geregistreerd.
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setInstemming({status:"ingestemd",tijdstempel:new Date().toISOString().slice(0,10),ip:"192.168.1.x"})}
                    style={{flex:1,padding:"11px",borderRadius:9,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
                    ✍️ Ik ga akkoord met de pensioenwijziging
                  </button>
                  <button style={{padding:"11px 16px",borderRadius:9,border:`1px solid ${T.danger}`,background:T.dangerBg,color:T.dangerText,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
                    Bezwaar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scenario Calculator ── */}
        {portaalTab==="scenario"&&<ScenarioCalculator wn={wn} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCENARIO CALCULATOR
// ══════════════════════════════════════════════════════════════════
function ScenarioCalculator({wn}){
  const [extraInleg,setExtraInleg]=useState(0);
  const [pensioenLeeftijd,setPensioenLeeftijd]=useState(67);
  const [parttimePct,setParttimePct]=useState(100);
  const [hoogLaag,setHoogLaag]=useState(false);
  const [hoogPct,setHoogPct]=useState(120); // % van normaal eerste 5 jr

  const franchise=17545;
  const rj=Math.max(0,pensioenLeeftijd-wn.leeftijd);
  const grondslag=Math.max(0,wn.salaris-franchise)*(parttimePct/100);
  const jaarInleg=grondslag*((wn.premiePerc+extraInleg)/100);

  // Vervroegings/verlatingsactor (actuarieel vereenvoudigd)
  const pensioenFactor=pensioenLeeftijd===67?1:pensioenLeeftijd<67?Math.pow(0.94,67-pensioenLeeftijd):Math.pow(1.07,pensioenLeeftijd-67);

  function berekenP(r){
    if(rj<=0) return 0;
    const fv=((Math.pow(1+r,rj)-1)/r)*(1+r);
    const kap=jaarInleg*fv;
    const uitk=maandUit(kap)*pensioenFactor;
    return Math.max(0,uitk);
  }

  const p5=berekenP(0.01),p50=berekenP(0.04),p95=berekenP(0.07);
  const aow=pensioenLeeftijd>=67?wn.aow:0; // AOW pas vanaf 67

  const hoogMnd = hoogLaag ? p50*(hoogPct/100) : p50;
  const laagMnd = hoogLaag ? p50*(200-hoogPct)/100 : p50;

  const grafData=[
    {sc:"Slecht weer",aow,pensioen:p5,kleur:T.dangerText},
    {sc:"Verwacht",   aow,pensioen:p50,kleur:T.warn},
    {sc:"Goed weer",  aow,pensioen:p95,kleur:T.accent},
  ];

  const CTip=({active,payload,label})=>{if(!active||!payload?.length)return null;const d=grafData.find(g=>g.sc===label);return(<div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 13px",fontSize:11,fontFamily:T.font}}><div style={{fontWeight:700,marginBottom:5,color:T.text}}>{label}</div>{aow>0&&<div style={{color:T.aow,marginBottom:2}}>AOW: {eur(aow)}/mnd</div>}<div style={{color:d?.kleur,fontWeight:600}}>Pensioen: {eur(d?.pensioen)}/mnd</div><div style={{color:T.text,marginTop:4,fontWeight:700}}>Totaal: {eur((d?.aow||0)+(d?.pensioen||0))}/mnd</div></div>);};

  return(
    <div>
      <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3,fontFamily:T.font}}>Wat-als calculator</div>
      <div style={{fontSize:12,color:T.textSec,marginBottom:14,fontFamily:T.font}}>Bereken het effect van uw keuzes op uw pensioen</div>

      {/* Sliders */}
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:14}}>

        {/* Extra inleg */}
        <div style={{background:T.bgCard,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>Extra inleg</div>
            <div style={{fontSize:18,fontWeight:700,color:T.accent,fontFamily:T.mono}}>+{extraInleg.toFixed(1)}%</div>
          </div>
          <input type="range" min={0} max={8} step={0.5} value={extraInleg} onChange={e=>setExtraInleg(+e.target.value)} style={{width:"100%",accentColor:T.accent}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}><span>0% (geen extra)</span><span>+8% (max)</span></div>
          {extraInleg>0&&<div style={{marginTop:6,fontSize:11,color:T.accent,fontFamily:T.font}}>Extra inleg: {eurC(grondslag*(extraInleg/100))}/jr</div>}
        </div>

        {/* Pensioenleeftijd */}
        <div style={{background:T.bgCard,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>Pensioenleeftijd</div>
            <div style={{fontSize:18,fontWeight:700,color:T.blue,fontFamily:T.mono}}>{pensioenLeeftijd} jaar</div>
          </div>
          <input type="range" min={57} max={71} step={1} value={pensioenLeeftijd} onChange={e=>setPensioenLeeftijd(+e.target.value)} style={{width:"100%",accentColor:T.blue}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}><span>57 (vroeg)</span><span>67 (standaard)</span><span>71 (laat)</span></div>
          {pensioenLeeftijd!==67&&<div style={{marginTop:5,fontSize:11,color:T.blue,fontFamily:T.font}}>
            {pensioenLeeftijd<67?`⚠ ${67-pensioenLeeftijd} jaar eerder → actuariële korting toegepast`:`+${pensioenLeeftijd-67} jaar later → actuariële opslag toegepast`}
          </div>}
          {pensioenLeeftijd<67&&aow===0&&<div style={{marginTop:3,fontSize:10,color:T.dangerText,fontFamily:T.font}}>Let op: AOW-uitkering nog niet beschikbaar vóór 67 jaar</div>}
        </div>

        {/* Deeltijdpensioen */}
        <div style={{background:T.bgCard,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>Arbeidsomvang resterende jaren</div>
            <div style={{fontSize:18,fontWeight:700,color:T.purple,fontFamily:T.mono}}>{parttimePct}%</div>
          </div>
          <input type="range" min={20} max={100} step={10} value={parttimePct} onChange={e=>setParttimePct(+e.target.value)} style={{width:"100%",accentColor:T.purple}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}><span>20% deeltijd</span><span>100% voltijd</span></div>
        </div>

        {/* Hoog/laag constructie */}
        <div style={{background:T.bgCard,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:hoogLaag?10:0}}>
            <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>Hoog/laag-constructie</div>
            <button onClick={()=>setHoogLaag(h=>!h)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${hoogLaag?T.accent:T.border}`,background:hoogLaag?T.accent:T.bgSec,color:hoogLaag?"#fff":T.textSec,fontSize:11,cursor:"pointer",fontFamily:T.font}}>
              {hoogLaag?"Aan":"Uit"}
            </button>
          </div>
          {hoogLaag&&(
            <div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:8,fontFamily:T.font}}>Eerste 5 jaar hoger pensioen, daarna lager (of omgekeerd)</div>
              <input type="range" min={110} max={150} step={5} value={hoogPct} onChange={e=>setHoogPct(+e.target.value)} style={{width:"100%",accentColor:T.accent}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}>
                <span>Eerste 5 jr: {eur(hoogMnd)}/mnd</span><span>Daarna: {eur(laagMnd)}/mnd</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultaat grafiek */}
      <div style={{background:T.bgCard,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.border}`,marginBottom:10}}>
        <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:10,fontFamily:T.font}}>Resultaat — verwacht pensioen/mnd</div>
        <div style={{height:160}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grafData} barSize={52} margin={{top:8,right:8,bottom:0,left:16}}>
              <XAxis dataKey="sc" tick={{fontSize:10,fontFamily:T.font,fill:T.textTer}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`€${Math.round(v/100)*100}`} tick={{fontSize:9,fontFamily:T.mono,fill:T.textTer}} axisLine={false} tickLine={false} width={38}/>
              <Tooltip content={<CTip/>}/>
              <Bar dataKey="aow" stackId="a" fill={T.aow} fillOpacity={0.7}/>
              <Bar dataKey="pensioen" stackId="a" radius={[4,4,0,0]}>{grafData.map((g,i)=><Cell key={i} fill={g.kleur}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Verwacht resultaat */}
      <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:9,padding:"10px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:12,fontWeight:600,color:T.accent,fontFamily:T.font}}>Verwacht pensioen (P50) inclusief AOW</div>
        <div style={{fontSize:20,fontWeight:700,fontFamily:T.mono,color:T.accent}}>{eur(aow+p50)}<span style={{fontSize:11,fontWeight:400}}>/mnd</span></div>
      </div>

      <div style={{marginTop:8,fontSize:10,color:T.textTer,fontFamily:T.font}}>
        Berekening op basis van DNB URM 2026Q1 · Resultaten zijn indicatief en geen garantie · Actuariële kortings- en opslagfactoren zijn vereenvoudigd
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT NAVIGATIE
// ══════════════════════════════════════════════════════════════════
export default function BeheerNazorg(){
  const [view,setView]=useState("beheer");
  const [beheerTab,setBeheerTab]=useState("alerts");

  useEffect(()=>{
    if(!document.getElementById("af-font")){
      const l=document.createElement("link");l.id="af-font";l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
      document.head.appendChild(l);
    }
  },[]);

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:"100vh"}}>
      {/* Demo nav */}
      <div style={{background:"#1a1a18",padding:"10px 20px",display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:11,color:"#555",marginRight:8}}>Demo view:</span>
        {[["beheer","👔 Adviseur — Beheer"],["portaal","👤 Werknemer — Portaal"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{padding:"5px 12px",borderRadius:6,border:"none",background:view===k?"#1d9e75":"#333",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:T.font}}>{l}</button>
        ))}
      </div>

      {/* Adviseur beheer */}
      {view==="beheer"&&(
        <div style={{maxWidth:940,margin:"0 auto",padding:24}}>
          {/* Breadcrumb */}
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.textTer,marginBottom:20,fontFamily:T.font,flexWrap:"wrap"}}>
            <span>Oranje Techniek B.V.</span><span>/</span>
            <span style={{color:T.text,fontWeight:500}}>Beheer & Nazorg</span>
            <div style={{marginLeft:"auto",display:"flex",gap:5}}>
              {[["alerts","🔔 Alerts"],["mutaties","👥 Mutaties"],["instemming","✍️ Instemming"]].map(([k,l])=>(
                <button key={k} onClick={()=>setBeheerTab(k)} style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:500,border:`0.5px solid ${beheerTab===k?T.accent:T.border}`,background:beheerTab===k?T.accent:T.bgSec,color:beheerTab===k?"#fff":T.textTer,cursor:"pointer",fontFamily:T.font}}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {beheerTab==="alerts"   && <AlertDashboard onNaarMutatie={()=>setBeheerTab("mutaties")} />}
          {beheerTab==="mutaties" && <MutatieImport onTerug={()=>setBeheerTab("alerts")} />}
          {beheerTab==="instemming" && (
            <div>
              <div style={{marginBottom:18}}>
                <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Instemmingsbeheer</h2>
                <p style={{margin:0,fontSize:13,color:T.textSec}}>Oranje Techniek B.V. — digitale instemming per werknemer</p>
              </div>
              <InstemmingDashboard/>
            </div>
          )}
        </div>
      )}

      {/* Werknemersportaal */}
      {view==="portaal"&&(
        <div style={{maxWidth:600,margin:"0 auto",padding:"24px 16px"}}>
          <WerknemersPortaal/>
        </div>
      )}
    </div>
  );
}
