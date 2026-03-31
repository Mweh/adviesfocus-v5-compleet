import { useState, useMemo, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line } from "recharts";

// ══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════
const T = {
  bg: "#f7f6f3", bgCard: "#ffffff", bgSec: "#f1efe8",
  border: "rgba(15,15,14,0.10)", borderSec: "rgba(15,15,14,0.06)",
  text: "#0f0f0e", textSec: "rgba(15,15,14,0.55)", textTer: "rgba(15,15,14,0.38)",
  accent: "#1d9e75", accentBg: "#e0f2ee",
  warn: "#ef9f27", warnBg: "#faeeda", warnText: "#854f0b",
  danger: "#e24b4a", dangerBg: "#fcebeb", dangerText: "#a32d2d",
  blue: "#185fa5", blueBg: "#e6f1fb",
  purple: "#5b4fcf", purpleBg: "#edeaf8",
  aow: "#94a3b8",
  font: "'DM Sans', system-ui, sans-serif",
  mono: "'DM Mono', monospace",
};

// ══════════════════════════════════════════════════════════════════
// GETAL HELPERS
// ══════════════════════════════════════════════════════════════════
const eur = (n) => new Intl.NumberFormat("nl-NL", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(n ?? 0);
function eurCompact(n) {
  const v = n ?? 0;
  if (v >= 1_000_000) return `€\u00a0${(v/1_000_000).toLocaleString("nl-NL",{minimumFractionDigits:1,maximumFractionDigits:2})}\u00a0mln`;
  if (v >= 1_000)     return `€\u00a0${(v/1_000).toLocaleString("nl-NL",{minimumFractionDigits:0,maximumFractionDigits:1})}\u00a0k`;
  return eur(v);
}
function eurAs(n) {
  if (n >= 1_000_000) return `${(n/1_000_000).toLocaleString("nl-NL",{maximumFractionDigits:1})} mln`;
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}k`;
  return `${n}`;
}
const pct = (n) => n != null && n !== "" ? `${parseFloat(n).toFixed(2)}%` : "—";

// ══════════════════════════════════════════════════════════════════
// REKENKERN MODULE A
// ══════════════════════════════════════════════════════════════════
function staffelPremie(l) {
  if (l < 25) return 0.054; if (l < 30) return 0.068; if (l < 35) return 0.087;
  if (l < 40) return 0.110; if (l < 45) return 0.139; if (l < 50) return 0.176;
  if (l < 55) return 0.222; if (l < 60) return 0.280; return 0.322;
}
const AOW = 67; const RENTE = 0.04;
function berekenWn(w, franchise, premiePerc, factor) {
  const gs = Math.max(0, w.salaris - franchise) * (w.parttimePerc / 100);
  const rj = Math.max(0, AOW - w.leeftijd);
  const iOud = gs * staffelPremie(w.leeftijd);
  const iNieuw = gs * (premiePerc / 100);
  const fv = rj > 0 ? ((Math.pow(1+RENTE,rj)-1)/RENTE) : 1;
  const verschil = iNieuw - iOud;
  const compJaar = Math.max(0,-verschil) * factor;
  return { ...w, grondslag:gs, inlegOud:iOud, inlegNieuw:iNieuw, verschilInleg:verschil,
    kapitaalOud:iOud*fv, kapitaalNieuw:iNieuw*fv, compensatieJaar:compJaar, compensatieTotaal:compJaar*rj, restJaren:rj };
}

// ══════════════════════════════════════════════════════════════════
// CSV IMPORT
// ══════════════════════════════════════════════════════════════════
const CSV_COLS = ["naam","geboortejaar","salaris","parttime_perc","dienstjaren"];
const CSV_TEMPLATE = `naam,geboortejaar,salaris,parttime_perc,dienstjaren\nA. de Vries,1978,58000,100,18\nB. Janssen,1985,44500,80,12\nC. Peters,1991,37200,100,7\nD. Bakker,1969,72000,100,28\nE. Visser,1995,31000,60,4`;
function downloadCSV() {
  const b = new Blob([CSV_TEMPLATE],{type:"text/csv;charset=utf-8;"});
  const u = URL.createObjectURL(b); const a = document.createElement("a");
  a.href=u; a.download="werknemers_template_adviesfocus.csv"; a.click(); URL.revokeObjectURL(u);
}
function parseCSV(txt) {
  const rows = txt.trim().split(/\r?\n/).filter(r=>r.trim());
  if (rows.length < 2) throw new Error("Geen datarijen.");
  const hdr = rows[0].split(",").map(h=>h.trim().toLowerCase());
  const miss = CSV_COLS.filter(k=>!hdr.includes(k));
  if (miss.length) throw new Error(`Ontbrekende kolommen: ${miss.join(", ")}`);
  const idx = k=>hdr.indexOf(k);
  const fouten=[]; const wns=[];
  rows.slice(1).forEach((r,i)=>{
    const v=r.split(",").map(x=>x.trim()); const rn=i+2;
    const naam=v[idx("naam")]; const gbj=parseInt(v[idx("geboortejaar")]);
    const sal=parseFloat(v[idx("salaris")]); const pt=parseFloat(v[idx("parttime_perc")]);
    const dj=parseInt(v[idx("dienstjaren")]); const lft=new Date().getFullYear()-gbj;
    if(!naam) fouten.push(`Rij ${rn}: naam ontbreekt`);
    if(isNaN(gbj)||gbj<1940||gbj>2005) fouten.push(`Rij ${rn}: ongeldig geboortejaar`);
    if(isNaN(sal)||sal<5000) fouten.push(`Rij ${rn}: ongeldig salaris`);
    if(isNaN(pt)||pt<10||pt>100) fouten.push(`Rij ${rn}: ongeldige parttime%`);
    if(naam&&!isNaN(sal)&&!isNaN(pt)) wns.push({id:i+1,naam,leeftijd:isNaN(lft)?40:lft,salaris:sal,parttimePerc:pt,dienstjaren:isNaN(dj)?0:dj});
  });
  return {werknemers:wns,fouten};
}

// ══════════════════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════════════════
const MOCK = (() => {
  const namen=["A. de Vries","B. Janssen","C. Peters","D. Bakker","E. Visser","F. de Boer","G. Meijer","H. van Dijk","I. Smit","J. Mulder","K. de Graaf","L. Hendriks","M. Vermeer","N. van den Berg","O. Jacobs","P. Koster","Q. Brouwer","R. Lammers","S. van Leeuwen","T. de Wit","U. Willems","V. Driessen","W. Hoekstra","X. van der Meer","Y. Bosman","Z. Tijssen","AA. Dekker","BB. Verhoeven","CC. Kuijpers","DD. van Heel","EE. Bos","FF. Prins","GG. Gerritsen","HH. Vogel","II. Schäfer","JJ. Huisman","KK. Peeters","LL. Bijlsma","MM. Franken","NN. Westra","OO. Gerrits","PP. Konings","QQ. van Zanten","RR. Mol","SS. Spijker"];
  return namen.map((naam,i)=>({id:i+1,naam,leeftijd:22+Math.floor(Math.abs(Math.sin(i*7.3)*40)),salaris:28000+Math.floor(Math.abs(Math.sin(i*3.7)*72000)),parttimePerc:[100,100,100,80,60][i%5],dienstjaren:3+(i%20)}));
})();

// ══════════════════════════════════════════════════════════════════
// MODULE B — PRODUCTVERGELIJKING CONSTANTEN
// ══════════════════════════════════════════════════════════════════
const AANBIEDERS = ["Nationale-Nederlanden","ASR","Aegon","Centraal Beheer","Zwitserleven","Reaal","BrandNewDay","PGB","Achmea","ABN AMRO Verzekeringen","Allianz","Anders"];
const LIFECYCLE_OPTS = ["Neutraal","Defensief","Offensief","Maatwerk mogelijk","Vastrentend only"];
const NABESTAANDEN_OPTS = ["Ja – ANW-volgend","Ja – vast bedrag","Beperkt","Nee"];
const KEUZE_OPTS = ["Ja – volledig portaal","Ja – basis tools","Beperkt","Nee"];
const WEGINGEN = {
  goedkoopst:    {premie:40,kosten:30,lifecycle:10,nabestaanden:10,keuzebegeleiding:10},
  beste_dekking: {premie:10,kosten:10,lifecycle:20,nabestaanden:35,keuzebegeleiding:25},
  meeste_keuze:  {premie:15,kosten:10,lifecycle:25,nabestaanden:15,keuzebegeleiding:35},
};
function scoreVeld(veld,waarde,alle) {
  if(veld==="premie"||veld==="kosten"){const nums=alle.filter(v=>v>0);if(!nums.length||!waarde)return 0;const mn=Math.min(...nums),mx=Math.max(...nums);return mx===mn?100:Math.round((1-(waarde-mn)/(mx-mn))*100);}
  if(veld==="lifecycle") return {Maatwerk:100,Offensief:85,Neutraal:70,Defensief:55,Vastrentend:30}[waarde?.split(" ")[0]]??50;
  if(veld==="nabestaanden") return {"Ja – ANW-volgend":100,"Ja – vast bedrag":75,"Beperkt":40,"Nee":0}[waarde]??0;
  if(veld==="keuzebegeleiding") return {"Ja – volledig portaal":100,"Ja – basis tools":70,"Beperkt":35,"Nee":0}[waarde]??0;
  return 0;
}
function berekenScore(o,alle,weging) {
  const w=WEGINGEN[weging];
  const premies=alle.map(x=>parseFloat(x.premie)||0);
  const kosten=alle.map(x=>parseFloat(x.kosten)||0);
  return Math.round((scoreVeld("premie",parseFloat(o.premie)||0,premies)*w.premie+scoreVeld("kosten",parseFloat(o.kosten)||0,kosten)*w.kosten+scoreVeld("lifecycle",o.lifecycle,[])*w.lifecycle+scoreVeld("nabestaanden",o.nabestaanden,[])*w.nabestaanden+scoreVeld("keuzebegeleiding",o.keuzebegeleiding,[])*w.keuzebegeleiding)/100);
}
const leegOfferte = id => ({id,aanbieder:"",premie:"",kosten:"",lifecycle:"",nabestaanden:"",keuzebegeleiding:"",urm:"",notitie:""});

// ══════════════════════════════════════════════════════════════════
// KLEINE UI ATOMS
// ══════════════════════════════════════════════════════════════════
function Pill({color,bg,children}) { return <span style={{fontSize:11,fontWeight:500,color,background:bg,padding:"2px 8px",borderRadius:99,fontFamily:T.font}}>{children}</span>; }
function KpiCard({label,value,sub,color,bg}) {
  return <div style={{background:bg||T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
    <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color:color||T.text,fontFamily:T.mono,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:3,fontFamily:T.font}}>{sub}</div>}
  </div>;
}
function SortHdr({label,col,sc,sd,onSort,align="left"}) {
  const a=sc===col;
  return <th onClick={()=>onSort(col)} style={{padding:"8px 10px",fontSize:11,fontWeight:600,color:a?T.text:T.textTer,textAlign:align,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",fontFamily:T.font,textTransform:"uppercase",letterSpacing:".04em",background:T.bgSec,borderBottom:`1px solid ${T.border}`}}>
    {label} {a?(sd==="asc"?"↑":"↓"):<span style={{color:T.borderSec}}>↕</span>}
  </th>;
}
function CohortTip({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:12,fontFamily:T.font,boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}>
    <div style={{fontWeight:600,marginBottom:4,color:T.text}}>Cohort {label}</div>
    <div style={{color:payload[0].value>0?T.dangerText:T.accent}}>Compensatielast: {eur(payload[0].value)}</div>
  </div>;
}
function ScoreBalk({score}) {
  const kleur=score>=70?T.accent:score>=45?T.warn:T.danger;
  return <div style={{display:"flex",alignItems:"center",gap:8}}>
    <div style={{flex:1,height:5,background:T.bgSec,borderRadius:3,overflow:"hidden"}}>
      <div style={{width:`${score}%`,height:"100%",background:kleur,borderRadius:3,transition:"width .3s"}}/>
    </div>
    <span style={{fontSize:12,fontWeight:700,color:kleur,fontFamily:T.mono,width:28,textAlign:"right"}}>{score}</span>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// OPSLAAN FOOTER (gedeeld)
// ══════════════════════════════════════════════════════════════════
function OpslaanFooter({info, onVolgende, labelVolgende}) {
  const [status,setStatus]=useState("idle");
  const opslaan=()=>{setStatus("saving");setTimeout(()=>{setStatus("saved");setTimeout(()=>setStatus("idle"),3000);},800);};
  return (
    <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,marginTop:16}}>
      <div style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>
        {status==="saved"?<span style={{color:T.accent,fontWeight:500}}>✓ Opgeslagen in dossier</span>:<span style={{color:T.textTer}}>{info}</span>}
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <button onClick={opslaan} disabled={status==="saving"} style={{padding:"9px 16px",borderRadius:8,border:`1px solid ${status==="saved"?T.accent:T.border}`,background:status==="saved"?T.accentBg:T.bgSec,color:status==="saved"?T.accent:T.text,fontSize:13,fontWeight:500,cursor:status==="saving"?"not-allowed":"pointer",fontFamily:T.font,opacity:status==="saving"?0.6:1}}>
          {status==="saving"?"Opslaan…":status==="saved"?"✓ Opgeslagen":"Opslaan in dossier"}
        </button>
        <button onClick={onVolgende} style={{padding:"9px 18px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",gap:7}}>
          {labelVolgende} <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CSV IMPORT MODAL
// ══════════════════════════════════════════════════════════════════
function ImportModal({onClose,onImport}) {
  const [fase,setFase]=useState("upload");
  const [dragOver,setDragOver]=useState(false);
  const [preview,setPreview]=useState([]);
  const [fouten,setFouten]=useState([]);
  const [naam,setNaam]=useState("");
  const ref=useRef(null);

  function verwerk(file) {
    if(!file) return; setNaam(file.name);
    const r=new FileReader();
    r.onload=e=>{try{const {werknemers:w,fouten:f}=parseCSV(e.target.result);setPreview(w);setFouten(f);setFase(f.length>0&&w.length===0?"fouten":"preview");}catch(e){setFouten([e.message]);setFase("fouten");}};
    r.readAsText(file);
  }

  const loonsom=preview.reduce((s,w)=>s+w.salaris*(w.parttimePerc/100),0);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,15,14,0.55)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.bgCard,borderRadius:16,width:580,maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,.22)"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"22px 24px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <h3 style={{margin:"0 0 3px",fontSize:16,fontWeight:700,color:T.text,fontFamily:T.font}}>Werknemers importeren</h3>
            <p style={{margin:0,fontSize:12,color:T.textSec,fontFamily:T.font}}>Upload CSV vanuit salarisadministratie</p>
          </div>
          <button onClick={onClose} style={{background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,color:T.textTer}}>×</button>
        </div>
        <div style={{padding:"16px 24px 24px"}}>
          {/* Template */}
          <div style={{background:T.bgSec,border:`0.5px solid ${T.border}`,borderRadius:9,padding:"11px 14px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:2,fontFamily:T.font}}>📥 Template downloaden</div>
              <div style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>naam · geboortejaar · salaris · parttime_perc · dienstjaren</div>
            </div>
            <button onClick={downloadCSV} style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${T.accent}`,background:T.accentBg,color:T.accent,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>Download</button>
          </div>

          {(fase==="upload"||fase==="fouten") && (
            <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);verwerk(e.dataTransfer.files[0]);}}
              onClick={()=>ref.current?.click()}
              style={{border:`2px dashed ${dragOver?T.accent:T.border}`,borderRadius:10,padding:"24px 20px",textAlign:"center",cursor:"pointer",background:dragOver?T.accentBg:T.bgSec}}>
              <input ref={ref} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>verwerk(e.target.files[0])}/>
              <div style={{fontSize:26,marginBottom:6}}>📂</div>
              <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Sleep CSV hierheen of klik</div>
            </div>
          )}
          {fase==="fouten"&&fouten.length>0&&(
            <div style={{marginTop:10,background:T.dangerBg,border:`0.5px solid ${T.danger}44`,borderRadius:8,padding:"10px 12px"}}>
              {fouten.map((f,i)=><div key={i} style={{fontSize:11,color:T.dangerText,fontFamily:T.mono}}>{f}</div>)}
            </div>
          )}
          {fase==="preview"&&preview.length>0&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>{naam}</span>
                <Pill color={T.accent} bg={T.accentBg}>{preview.length} werknemers</Pill>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                {[{l:"Werknemers",v:`${preview.length}`},{l:"Gem. leeftijd",v:`${(preview.reduce((s,w)=>s+w.leeftijd,0)/preview.length).toFixed(1)} jr`},{l:"Gem. salaris",v:eurCompact(preview.reduce((s,w)=>s+w.salaris,0)/preview.length)},{l:"Totale loonsom",v:eurCompact(loonsom)}].map(k=>(
                  <div key={k.l} style={{background:T.bgSec,borderRadius:7,padding:"7px 9px"}}>
                    <div style={{fontSize:9,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:1,fontFamily:T.font}}>{k.l}</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:T.mono}}>{k.v}</div>
                  </div>
                ))}
              </div>
              <div style={{border:`0.5px solid ${T.border}`,borderRadius:8,overflow:"hidden",marginBottom:12}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:T.bgSec}}>
                    {["Naam","Leeftijd","Salaris","Parttime","Dienstjaren"].map(h=><th key={h} style={{padding:"5px 9px",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".04em",textAlign:"left",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {preview.slice(0,6).map((w,i)=>(
                      <tr key={w.id} style={{background:i%2===0?T.bgCard:T.bgSec}}>
                        <td style={{padding:"4px 9px",fontSize:11,fontFamily:T.font,color:T.text}}>{w.naam}</td>
                        <td style={{padding:"4px 9px",fontSize:11,fontFamily:T.mono,color:T.textSec}}>{w.leeftijd} jr</td>
                        <td style={{padding:"4px 9px",fontSize:11,fontFamily:T.mono,color:T.textSec}}>{eur(w.salaris)}</td>
                        <td style={{padding:"4px 9px",fontSize:11,fontFamily:T.mono,color:T.textSec}}>{w.parttimePerc}%</td>
                        <td style={{padding:"4px 9px",fontSize:11,fontFamily:T.mono,color:T.textSec}}>{w.dienstjaren} jr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length>6&&<div style={{padding:"4px 9px",background:T.bgSec,fontSize:10,color:T.textTer,fontFamily:T.font}}>+ {preview.length-6} meer</div>}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button onClick={()=>{setFase("upload");setPreview([]);setFouten([]);}} style={{padding:"7px 13px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:12,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>Ander bestand</button>
                <button onClick={()=>{onImport(preview);onClose();}} style={{padding:"7px 16px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>{preview.length} werknemers importeren →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE A — CONFIGURATIE SCHERM
// ══════════════════════════════════════════════════════════════════
function ConfigScherm({config,setConfig,werknemers,onImport,onBerekenen}) {
  const {franchise,vlakkePremie,compensatieFactor,scenario}=config;
  const loonsom=werknemers.reduce((s,w)=>s+w.salaris*(w.parttimePerc/100),0);
  const isMock=werknemers===MOCK;

  return (
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{margin:"0 0 4px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>WTP-Transitie & Compensatie</h2>
        <p style={{margin:0,fontSize:13,color:T.textSec}}>Stel de parameters in voor de transitieberekening.</p>
      </div>

      {/* Blok 1 */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"16px 18px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:2,fontFamily:T.font}}>Werknemersbestand</div>
            <div style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>{isMock?"Voorbeelddata — upload uw eigen CSV":`${werknemers.length} werknemers geladen`}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Pill color={isMock?T.warnText:T.accent} bg={isMock?T.warnBg:T.accentBg}>{isMock?"⚠ Voorbeelddata":`${werknemers.length} werknemers`}</Pill>
            <button onClick={onImport} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:T.font,color:T.text,display:"flex",alignItems:"center",gap:4}}>
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3 6l3.5 3.5L10 6M1 11h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> CSV importeren
            </button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[
            {label:"Werknemers",val:`${werknemers.length}`},
            {label:"Gem. leeftijd",val:`${(werknemers.reduce((s,w)=>s+w.leeftijd,0)/werknemers.length).toFixed(1)} jaar`},
            {label:"Gemiddeld salaris",val:eurCompact(werknemers.reduce((s,w)=>s+w.salaris,0)/werknemers.length)},
            {label:"Totale loonsom",val:eurCompact(loonsom)},
          ].map(k=>(
            <div key={k.label} style={{background:T.bgSec,borderRadius:8,padding:"9px 11px"}}>
              <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".04em",marginBottom:3,fontFamily:T.font}}>{k.label}</div>
              <div style={{fontSize:15,fontWeight:700,color:T.text,fontFamily:T.mono,lineHeight:1.2}}>{k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Blok 2 + 3 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        {/* Huidig */}
        <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:2,fontFamily:T.font}}>Huidige regeling</div>
          <div style={{fontSize:11,color:T.textSec,marginBottom:14,fontFamily:T.font}}>Nulsituatie — overgenomen uit inventarisatie</div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:500,color:T.textSec,textTransform:"uppercase",letterSpacing:".04em",display:"block",marginBottom:5,fontFamily:T.font}}>Franchise</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.textTer,fontFamily:T.mono}}>€</span>
              <input type="number" value={franchise} onChange={e=>setConfig(c=>({...c,franchise:+e.target.value}))}
                style={{width:"100%",padding:"9px 11px 9px 22px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.mono,color:T.text,background:T.bgCard,outline:"none",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>
          </div>
          <label style={{fontSize:11,fontWeight:500,color:T.textSec,textTransform:"uppercase",letterSpacing:".04em",display:"block",marginBottom:7,fontFamily:T.font}}>Staffelpremies</label>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {[[20,0.054],[25,0.068],[30,0.087],[35,0.110],[40,0.139],[45,0.176],[50,0.222],[55,0.280],[60,0.322]].map(([l,p])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:T.textTer,width:48,flexShrink:0,fontFamily:T.mono}}>{l}–{l+4}jr</span>
                <div style={{flex:1,height:5,background:T.bgSec,borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${p*250}%`,height:"100%",background:`hsl(${20+l*2},70%,52%)`,borderRadius:3}}/>
                </div>
                <span style={{fontSize:10,fontWeight:600,color:T.text,width:34,textAlign:"right",fontFamily:T.mono}}>{(p*100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nieuw */}
        <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:2,fontFamily:T.font}}>Nieuwe regeling</div>
          <div style={{fontSize:11,color:T.textSec,marginBottom:18,fontFamily:T.font}}>Doelsituatie — ingesteld via Module C inventarisatie</div>
          <div style={{marginBottom:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
              <label style={{fontSize:11,fontWeight:500,color:T.textSec,textTransform:"uppercase",letterSpacing:".04em",fontFamily:T.font}}>Vlakke premie</label>
              <span style={{fontSize:26,fontWeight:700,color:T.accent,fontFamily:T.mono,lineHeight:1}}>{vlakkePremie}%</span>
            </div>
            <input type="range" min={10} max={30} step={0.5} value={vlakkePremie} onChange={e=>setConfig(c=>({...c,vlakkePremie:+e.target.value}))} style={{width:"100%",accentColor:T.accent}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}><span>10% sober</span><span>20% markt</span><span>30% royaal</span></div>
          </div>
          <div style={{marginBottom:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
              <label style={{fontSize:11,fontWeight:500,color:T.textSec,textTransform:"uppercase",letterSpacing:".04em",fontFamily:T.font}}>Compensatiefactor</label>
              <span style={{fontSize:26,fontWeight:700,color:T.blue,fontFamily:T.mono,lineHeight:1}}>{compensatieFactor.toFixed(1)}×</span>
            </div>
            <input type="range" min={0} max={1} step={0.1} value={compensatieFactor} onChange={e=>setConfig(c=>({...c,compensatieFactor:+e.target.value}))} style={{width:"100%",accentColor:T.blue}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}><span>0× geen</span><span>0.5× helft</span><span>1× volledig</span></div>
          </div>
          <label style={{fontSize:11,fontWeight:500,color:T.textSec,textTransform:"uppercase",letterSpacing:".04em",display:"block",marginBottom:7,fontFamily:T.font}}>Scenario</label>
          <div style={{display:"flex",gap:6}}>
            {[{id:"invaren",label:"Invaren",desc:"Iedereen vlakke premie"},{id:"eerbiedigend",label:"Eerbiedigende werking",desc:"Nieuw personeel vlak, huidig behoudt staffel"}].map(s=>{
              const sel=scenario===s.id;
              return <div key={s.id} onClick={()=>setConfig(c=>({...c,scenario:s.id}))} style={{flex:1,padding:"9px 10px",borderRadius:9,border:`1px solid ${sel?T.accent:T.border}`,background:sel?T.accentBg:T.bgSec,cursor:"pointer"}}>
                <div style={{fontSize:12,fontWeight:600,color:sel?T.accent:T.text,fontFamily:T.font}}>{s.label}</div>
                <div style={{fontSize:10,color:T.textTer,marginTop:1,fontFamily:T.font}}>{s.desc}</div>
              </div>;
            })}
          </div>
        </div>
      </div>

      <button onClick={onBerekenen} style={{width:"100%",padding:"13px",borderRadius:10,background:T.accent,color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Berekening uitvoeren
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE A — RESULTATEN SCHERM
// ══════════════════════════════════════════════════════════════════
function ResultatenScherm({config,setConfig,werknemers,onTerug,onNaarB}) {
  const [sortCol,setSortCol]=useState("leeftijd");
  const [sortDir,setSortDir]=useState("asc");
  const [filterRood,setFilterRood]=useState(false);
  const [zoek,setZoek]=useState("");
  const {vlakkePremie,compensatieFactor,scenario}=config;
  const eerbiedigend=scenario==="eerbiedigend";

  const berekend=useMemo(()=>werknemers.map(w=>{
    const b=berekenWn(w,config.franchise,vlakkePremie,compensatieFactor);
    return eerbiedigend?{...b,verschilInleg:0,compensatieJaar:0,compensatieTotaal:0}:b;
  }),[werknemers,config.franchise,vlakkePremie,compensatieFactor,eerbiedigend]);

  const totComp=berekend.reduce((s,w)=>s+w.compensatieTotaal,0);
  const totCompJaar=berekend.reduce((s,w)=>s+w.compensatieJaar,0);
  const geraaktWn=berekend.filter(w=>w.verschilInleg<0).length;
  const gemVersch=berekend.reduce((s,w)=>s+w.verschilInleg,0)/berekend.length;
  const dubbeleLasten=eerbiedigend?berekend.reduce((s,w)=>s+w.inlegOud*0.08*w.restJaren*0.5,0):0;

  const cohorts=useMemo(()=>{
    const m={};
    berekend.forEach(w=>{const b=Math.floor(w.leeftijd/5)*5;const k=`${b}–${b+4}`;if(!m[k])m[k]={label:k,compensatie:0,count:0,b};m[k].compensatie+=w.compensatieTotaal;m[k].count++;});
    return Object.values(m).sort((a,b)=>a.b-b.b);
  },[berekend]);

  const tabel=useMemo(()=>{
    let d=[...berekend];
    if(filterRood) d=d.filter(w=>w.verschilInleg<0);
    if(zoek) d=d.filter(w=>w.naam.toLowerCase().includes(zoek.toLowerCase()));
    d.sort((a,b)=>{const av=a[sortCol]??0,bv=b[sortCol]??0;const c=typeof av==="string"?av.localeCompare(bv):av-bv;return sortDir==="asc"?c:-c;});
    return d;
  },[berekend,sortCol,sortDir,filterRood,zoek]);

  const sort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc");}};

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Transitieanalyse — Resultaten</h2>
          <p style={{margin:0,fontSize:12,color:T.textSec}}>{werknemers.length} werknemers · vlakke premie {vlakkePremie}% · factor {compensatieFactor.toFixed(1)}×</p>
        </div>
        <button onClick={onTerug} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:12,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Parameters aanpassen
        </button>
      </div>

      {/* Scenario */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,fontFamily:T.font}}>Scenario vergelijker</div>
        <div style={{display:"flex",gap:8}}>
          {[{id:"invaren",icon:"⚡",label:"Invaren",desc:"Eenmalige compensatielast, één regeling."},{id:"eerbiedigend",icon:"🕰",label:"Eerbiedigende werking",desc:"Geen compensatie, dubbele administratie en oplopende staffelpremies."}].map(s=>{
            const sel=scenario===s.id;
            return <div key={s.id} onClick={()=>setConfig(c=>({...c,scenario:s.id}))} style={{flex:1,padding:"10px 12px",borderRadius:9,border:`1.5px solid ${sel?T.accent:T.border}`,background:sel?T.accentBg:T.bgSec,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                <span>{s.icon}</span><span style={{fontSize:12,fontWeight:600,color:sel?T.accent:T.text,fontFamily:T.font}}>{s.label}</span>
                {sel&&<span style={{marginLeft:"auto",fontSize:9,background:T.accent,color:"#fff",padding:"1px 6px",borderRadius:99}}>Actief</span>}
              </div>
              <div style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>{s.desc}</div>
            </div>;
          })}
        </div>
        {eerbiedigend&&<div style={{marginTop:8,padding:"8px 11px",background:T.warnBg,borderRadius:7,fontSize:11,color:T.warnText,fontFamily:T.font}}>⚠ Geschatte oplopende dubbele premielasten: <strong>{eurCompact(dubbeleLasten)}</strong> over de resterende looptijd.</div>}
      </div>

      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
        <KpiCard label={eerbiedigend?"Invaarcompensatie":"Totale compensatielast"} value={eerbiedigend?"€ 0":eurCompact(totComp)} sub={eerbiedigend?"Geen invaarcompensatie":"Over volledige looptijd"} color={!eerbiedigend&&totComp>0?T.dangerText:T.accent} bg={!eerbiedigend&&totComp>0?T.dangerBg:T.accentBg}/>
        <KpiCard label="Jaarlast compensatie" value={eerbiedigend?"→ stijgend":eurCompact(totCompJaar)} sub={eerbiedigend?"Staffel stijgt elk jaar":`Factor ${compensatieFactor.toFixed(1)}×`} color={eerbiedigend?T.warnText:T.blue} bg={eerbiedigend?T.warnBg:T.blueBg}/>
        <KpiCard label="Geraakt werknemers" value={eerbiedigend?"0":`${geraaktWn}`} sub={eerbiedigend?"Staffel blijft intact":`van ${werknemers.length} achteruit`} color={!eerbiedigend&&geraaktWn>0?T.dangerText:T.accent}/>
        <KpiCard label="Gem. verschil inleg/jr" value={eurCompact(Math.abs(gemVersch))} sub={gemVersch>=0?"gemiddeld vooruit":"gemiddeld achteruit"} color={gemVersch>=0?T.accent:T.dangerText}/>
      </div>

      {/* Live sliders */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"11px 14px",marginBottom:12,display:"flex",gap:20,alignItems:"center"}}>
        <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",fontFamily:T.font,whiteSpace:"nowrap"}}>Live aanpassen</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textSec,marginBottom:3,fontFamily:T.font}}><span>Vlakke premie</span><strong style={{color:T.accent,fontFamily:T.mono}}>{vlakkePremie}%</strong></div>
          <input type="range" min={10} max={30} step={0.5} value={vlakkePremie} onChange={e=>setConfig(c=>({...c,vlakkePremie:+e.target.value}))} style={{width:"100%",accentColor:T.accent}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textSec,marginBottom:3,fontFamily:T.font}}><span>Compensatiefactor</span><strong style={{color:eerbiedigend?T.textTer:T.blue,fontFamily:T.mono}}>{eerbiedigend?"n.v.t.":`${compensatieFactor.toFixed(1)}×`}</strong></div>
          <input type="range" min={0} max={1} step={0.1} value={compensatieFactor} onChange={e=>setConfig(c=>({...c,compensatieFactor:+e.target.value}))} style={{width:"100%",accentColor:T.blue,opacity:eerbiedigend?0.3:1}} disabled={eerbiedigend}/>
        </div>
      </div>

      {/* Grafiek */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:2,fontFamily:T.font}}>Compensatielast per leeftijdscohort</div>
        <div style={{fontSize:11,color:T.textSec,marginBottom:12,fontFamily:T.font}}>Rode bars = hoogste transitieschade. Middengroepen (40–55 jaar) zijn doorgaans het zwaarst getroffen.</div>
        <div style={{height:180}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cohorts} margin={{top:0,right:0,bottom:0,left:14}}>
              <XAxis dataKey="label" tick={{fontSize:10,fontFamily:T.font,fill:T.textTer}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={eurAs} tick={{fontSize:10,fontFamily:T.mono,fill:T.textTer}} axisLine={false} tickLine={false} width={50}/>
              <Tooltip content={<CohortTip/>}/>
              <ReferenceLine y={0} stroke={T.border}/>
              <Bar dataKey="compensatie" radius={[4,4,0,0]} maxBarSize={44}>
                {cohorts.map((e,i)=>{const mx=Math.max(...cohorts.map(d=>d.compensatie),1);const t=e.compensatie/mx;const r=Math.round(230*t+29*(1-t)),g=Math.round(75*t+158*(1-t)),b=Math.round(74*t+117*(1-t));return <Cell key={i} fill={eerbiedigend?"#e2e0d9":`rgb(${r},${g},${b})`}/>;})}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,overflow:"hidden",marginBottom:0}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font,flex:1}}>Berekening per werknemer</div>
          <input value={zoek} onChange={e=>setZoek(e.target.value)} placeholder="Zoek naam…" style={{padding:"5px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none",width:140}}/>
          <button onClick={()=>setFilterRood(f=>!f)} style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${filterRood?T.danger:T.border}`,background:filterRood?T.dangerBg:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:filterRood?T.dangerText:T.textSec,whiteSpace:"nowrap"}}>
            {filterRood?"✕ Filter uit":"🔴 Alleen geraakt"}
          </button>
          <span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>{tabel.length} rijen</span>
        </div>
        <div style={{overflowX:"auto",maxHeight:360,overflowY:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead style={{position:"sticky",top:0,zIndex:1}}>
              <tr>
                <SortHdr label="Naam" col="naam" sc={sortCol} sd={sortDir} onSort={sort}/>
                <SortHdr label="Lft" col="leeftijd" sc={sortCol} sd={sortDir} onSort={sort} align="center"/>
                <SortHdr label="Salaris" col="salaris" sc={sortCol} sd={sortDir} onSort={sort} align="right"/>
                <SortHdr label="Inleg oud/jr" col="inlegOud" sc={sortCol} sd={sortDir} onSort={sort} align="right"/>
                <SortHdr label="Inleg nieuw/jr" col="inlegNieuw" sc={sortCol} sd={sortDir} onSort={sort} align="right"/>
                <SortHdr label="Verschil/jr" col="verschilInleg" sc={sortCol} sd={sortDir} onSort={sort} align="right"/>
                <SortHdr label="Compensatie totaal" col="compensatieTotaal" sc={sortCol} sd={sortDir} onSort={sort} align="right"/>
              </tr>
            </thead>
            <tbody>
              {tabel.map((w,i)=>{
                const rood=w.verschilInleg<0,groen=w.verschilInleg>0;
                return <tr key={w.id} style={{background:i%2===0?T.bgCard:T.bgSec}}>
                  <td style={{padding:"6px 10px",fontSize:12,fontFamily:T.font,color:T.text,whiteSpace:"nowrap"}}>{w.naam}</td>
                  <td style={{padding:"6px 10px",fontSize:12,fontFamily:T.mono,color:T.textSec,textAlign:"center"}}>{w.leeftijd}</td>
                  <td style={{padding:"6px 10px",fontSize:12,fontFamily:T.mono,color:T.textSec,textAlign:"right"}}>{eur(w.salaris)}</td>
                  <td style={{padding:"6px 10px",fontSize:12,fontFamily:T.mono,color:T.textSec,textAlign:"right"}}>{eur(w.inlegOud)}</td>
                  <td style={{padding:"6px 10px",fontSize:12,fontFamily:T.mono,color:T.textSec,textAlign:"right"}}>{eur(w.inlegNieuw)}</td>
                  <td style={{padding:"6px 10px",fontSize:12,fontFamily:T.mono,fontWeight:600,textAlign:"right",color:rood?T.dangerText:groen?T.accent:T.textSec,background:rood?`${T.danger}10`:groen?`${T.accent}08`:"transparent"}}>
                    {rood?"▼ ":groen?"▲ ":""}{eur(Math.abs(w.verschilInleg))}
                  </td>
                  <td style={{padding:"6px 10px",fontSize:12,fontFamily:T.mono,textAlign:"right",color:eerbiedigend?T.textTer:w.compensatieTotaal>0?T.dangerText:T.textTer}}>
                    {eerbiedigend?"—":w.compensatieTotaal>0?eur(w.compensatieTotaal):"—"}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div style={{borderTop:`1px solid ${T.border}`,padding:"8px 14px",display:"flex",justifyContent:"flex-end",gap:14,background:T.bgSec}}>
          <span style={{fontSize:12,color:T.textTer,fontFamily:T.font}}>Totaal compensatielast:</span>
          <span style={{fontSize:13,fontWeight:700,fontFamily:T.mono,color:eerbiedigend?T.accent:totComp>0?T.dangerText:T.accent}}>
            {eerbiedigend?"€ 0 (eerbiedigend)":eur(totComp)}
          </span>
        </div>
      </div>

      <OpslaanFooter info={`${werknemers.length} werknemers · premie ${vlakkePremie}% · factor ${compensatieFactor.toFixed(1)}×`} onVolgende={onNaarB} labelVolgende="Naar productvergelijking"/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE B — PRODUCTVERGELIJKING
// ══════════════════════════════════════════════════════════════════
function ModuleB({onTerug,onNaarC}) {
  const [offertes,setOffertes]=useState([leegOfferte(1),leegOfferte(2),leegOfferte(3)]);
  const [weging,setWeging]=useState("goedkoopst");
  const [openIds,setOpenIds]=useState({1:true,2:true,3:true});

  const upd=(id,data)=>setOffertes(p=>p.map(o=>o.id===id?data:o));
  const del=(id)=>setOffertes(p=>p.filter(o=>o.id!==id));
  const add=()=>{const id=Math.max(...offertes.map(o=>o.id))+1;setOffertes(p=>[...p,leegOfferte(id)]);setOpenIds(p=>({...p,[id]:true}));};
  const toggleOpen=(id)=>setOpenIds(p=>({...p,[id]:!p[id]}));

  const scores=useMemo(()=>{const g=offertes.filter(o=>o.aanbieder);const r={};g.forEach(o=>{r[o.id]=berekenScore(o,g,weging);});return r;},[offertes,weging]);
  const winnaarId=useMemo(()=>{const g=offertes.filter(o=>o.aanbieder);if(!g.length)return null;return g.reduce((b,o)=>(scores[o.id]??0)>(scores[b.id]??0)?o:b,g[0]).id;},[scores,offertes]);
  const winnaar=offertes.find(o=>o.id===winnaarId);
  const aantalIngevuld=offertes.filter(o=>o.aanbieder).length;

  const scoreKleur=s=>s>=70?T.accent:s>=45?T.warn:T.danger;

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3,fontFamily:T.font}}>Analyse · Module 2.2</div>
          <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Markt- & Productvergelijking</h2>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Voer offertes in van minimaal 3 aanbieders. Scores worden live berekend op basis van het werkgeversprofiel.</p>
        </div>
        <button onClick={onTerug} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:12,cursor:"pointer",fontFamily:T.font,color:T.textSec,flexShrink:0}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Terug
        </button>
      </div>

      {/* Scoremodel */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,fontFamily:T.font}}>Scoremodel — werkgeversprofiel</div>
        <div style={{display:"flex",gap:8}}>
          {[{id:"goedkoopst",icon:"💰",label:"Goedkoopst",desc:"Premie 40% · kosten 30%"},{id:"beste_dekking",icon:"🛡",label:"Beste dekking",desc:"Nabestaanden 35% · keuze 25%"},{id:"meeste_keuze",icon:"🎯",label:"Meeste keuze",desc:"Keuzebeg. 35% · lifecycle 25%"}].map(s=>{
            const sel=weging===s.id;
            return <div key={s.id} onClick={()=>setWeging(s.id)} style={{flex:1,padding:"9px 11px",borderRadius:9,border:`1px solid ${sel?T.accent:T.border}`,background:sel?T.accentBg:T.bgSec,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                <span>{s.icon}</span><span style={{fontSize:12,fontWeight:600,color:sel?T.accent:T.text,fontFamily:T.font}}>{s.label}</span>
                {sel&&<span style={{marginLeft:"auto",fontSize:9,background:T.accent,color:"#fff",padding:"1px 5px",borderRadius:99}}>Actief</span>}
              </div>
              <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{s.desc}</div>
            </div>;
          })}
        </div>
      </div>

      {/* AFM banner */}
      {aantalIngevuld<3&&<div style={{background:T.warnBg,border:`0.5px solid ${T.warn}44`,borderRadius:9,padding:"8px 12px",fontSize:12,color:T.warnText,fontFamily:T.font,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
        <span>⚠</span><span>AFM-richtlijn vereist vergelijking van minimaal 3 aanbieders. Momenteel {aantalIngevuld} ingevuld.</span>
      </div>}

      {/* Offerte kaarten */}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
        {offertes.map((o,i)=>{
          const sel=openIds[o.id];
          const isW=o.id===winnaarId&&!!o.aanbieder;
          const sc=scores[o.id]??0;
          const up=(f,v)=>upd(o.id,{...o,[f]:v});

          return (
            <div key={o.id} style={{background:T.bgCard,border:`1px solid ${isW?T.accent:T.border}`,borderRadius:12,boxShadow:isW?`0 0 0 3px ${T.accent}18`:"none",overflow:"hidden"}}>
              {/* Kaart header */}
              <div style={{padding:"11px 14px",background:isW?T.accentBg:T.bgSec,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:isW?T.accent:T.border,color:isW?"#fff":T.textTer,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,fontFamily:T.mono,flexShrink:0}}>{i+1}</div>
                <select value={o.aanbieder} onChange={e=>up("aanbieder",e.target.value)} style={{flex:1,background:"transparent",border:"none",fontSize:14,fontWeight:600,fontFamily:T.font,color:o.aanbieder?T.text:T.textTer,outline:"none",cursor:"pointer"}}>
                  <option value="">— Aanbieder kiezen —</option>
                  {AANBIEDERS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {isW&&<span style={{fontSize:10,fontWeight:600,color:T.accent,background:"#fff",padding:"2px 7px",borderRadius:99,fontFamily:T.font}}>★ Beste</span>}
                  {o.aanbieder&&<div style={{textAlign:"right"}}><div style={{fontSize:9,color:T.textTer,fontFamily:T.font}}>Score</div><div style={{fontSize:17,fontWeight:700,color:scoreKleur(sc),fontFamily:T.mono,lineHeight:1}}>{sc}</div></div>}
                  <button onClick={()=>toggleOpen(o.id)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${T.border}`,background:T.bgCard,cursor:"pointer",fontSize:12,color:T.textTer}}>{sel?"▲":"▼"}</button>
                  {offertes.length>1&&<button onClick={()=>del(o.id)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${T.border}`,background:T.bgCard,cursor:"pointer",fontSize:13,color:T.textTer}}>×</button>}
                </div>
              </div>

              {/* Kaart body */}
              {sel&&(
                <div style={{padding:"12px 14px 10px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                    {/* Premie */}
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>Vlakke premie (%)</div>
                      <div style={{position:"relative"}}>
                        <input value={o.premie} onChange={e=>up("premie",e.target.value)} placeholder="18.50" type="number" step="0.01"
                          style={{width:"100%",padding:"7px 24px 7px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.mono,color:T.text,background:T.bgCard,outline:"none",boxSizing:"border-box"}}
                          onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
                        <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:T.textTer,fontFamily:T.mono}}>%</span>
                      </div>
                    </div>
                    {/* Kosten */}
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>Uitvoeringskosten (%)</div>
                      <div style={{position:"relative"}}>
                        <input value={o.kosten} onChange={e=>up("kosten",e.target.value)} placeholder="0.35" type="number" step="0.01"
                          style={{width:"100%",padding:"7px 24px 7px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.mono,color:T.text,background:T.bgCard,outline:"none",boxSizing:"border-box"}}
                          onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
                        <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:T.textTer,fontFamily:T.mono}}>%</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                    {/* Lifecycle */}
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>Lifecycle opties</div>
                      <select value={o.lifecycle} onChange={e=>up("lifecycle",e.target.value)} style={{width:"100%",padding:"7px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:o.lifecycle?T.text:T.textTer,background:T.bgCard,outline:"none"}}>
                        <option value="">Selecteer…</option>{LIFECYCLE_OPTS.map(x=><option key={x} value={x}>{x}</option>)}</select>
                    </div>
                    {/* Nabestaanden */}
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>Nabestaandenpensioen</div>
                      <select value={o.nabestaanden} onChange={e=>up("nabestaanden",e.target.value)} style={{width:"100%",padding:"7px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:o.nabestaanden?T.text:T.textTer,background:T.bgCard,outline:"none"}}>
                        <option value="">Selecteer…</option>{NABESTAANDEN_OPTS.map(x=><option key={x} value={x}>{x}</option>)}</select>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
                    {/* Keuzebegeleiding */}
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>Keuzebegeleiding</div>
                      <select value={o.keuzebegeleiding} onChange={e=>up("keuzebegeleiding",e.target.value)} style={{width:"100%",padding:"7px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:o.keuzebegeleiding?T.text:T.textTer,background:T.bgCard,outline:"none"}}>
                        <option value="">Selecteer…</option>{KEUZE_OPTS.map(x=><option key={x} value={x}>{x}</option>)}</select>
                    </div>
                    {/* URM */}
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>URM-projectie beschikbaar</div>
                      <div style={{display:"flex",gap:5}}>
                        {["Ja","Nee","Op aanvraag"].map(x=>{const s=o.urm===x;return <button key={x} onClick={()=>up("urm",x)} style={{padding:"5px 10px",borderRadius:99,fontSize:11,border:`1px solid ${s?T.accent:T.border}`,background:s?T.accent:T.bgSec,color:s?"#fff":T.textSec,cursor:"pointer",fontFamily:T.font}}>{x}</button>;})}
                      </div>
                    </div>
                  </div>
                  {/* Notitie */}
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>Notities / bijzondere voorwaarden</div>
                    <textarea value={o.notitie} onChange={e=>up("notitie",e.target.value)} placeholder="Bijv. min. contractduur, winstdeling, transitievergoeding aanbieder…" rows={2}
                      style={{width:"100%",padding:"7px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgCard,outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.5}}
                      onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
                  </div>
                  {/* Score balk */}
                  {o.aanbieder&&<div style={{marginTop:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,marginBottom:3,fontFamily:T.font}}><span>Totaalscore ({weging})</span></div>
                    <ScoreBalk score={sc}/>
                  </div>}
                  {/* Upload */}
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:T.bgSec,borderRadius:7,marginTop:10}}>
                    <span>📎</span>
                    <div style={{flex:1}}><div style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:T.font}}>Offertedocument PDF</div><div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>Upload de volledige offerte voor het dossier</div></div>
                    <button style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgCard,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>+ Upload</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Aanbieder toevoegen */}
      {offertes.length<6&&<button onClick={add} style={{width:"100%",padding:"10px",borderRadius:10,border:`1.5px dashed ${T.border}`,background:T.bgSec,color:T.textSec,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:T.font,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> Aanbieder toevoegen ({offertes.length}/6)
      </button>}

      {/* Vergelijkingstabel */}
      {aantalIngevuld>=2&&(()=>{
        const gevuld=offertes.filter(o=>o.aanbieder);
        const velden=[{k:"premie",l:"Vlakke premie",f:v=>pct(v)},{k:"kosten",l:"Uitvoeringskosten",f:v=>pct(v)},{k:"lifecycle",l:"Lifecycle",f:v=>v||"—"},{k:"nabestaanden",l:"Nabestaanden",f:v=>v||"—"},{k:"keuzebegeleiding",l:"Keuzebegeleiding",f:v=>v||"—"},{k:"urm",l:"URM",f:v=>v||"—"}];
        return (
          <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,overflow:"hidden",marginBottom:14}}>
            <div style={{padding:"11px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Vergelijkingstabel</div>
              <span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>{gevuld.length} aanbieders</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:T.bgSec}}>
                  <th style={{padding:"7px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>Kenmerk</th>
                  {gevuld.map(o=><th key={o.id} style={{padding:"7px 12px",textAlign:"center",fontSize:12,fontWeight:600,color:o.id===winnaarId?T.accent:T.text,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,background:o.id===winnaarId?T.accentBg:T.bgSec}}>
                    {o.aanbieder}{o.id===winnaarId&&<div style={{fontSize:9,color:T.accent}}>★ beste</div>}
                  </th>)}
                </tr></thead>
                <tbody>
                  {velden.map((v,vi)=>(
                    <tr key={v.k} style={{background:vi%2===0?T.bgCard:"#fafaf8"}}>
                      <td style={{padding:"6px 12px",fontSize:12,color:T.textSec,fontFamily:T.font,borderBottom:`0.5px solid ${T.borderSec}`}}>{v.l}</td>
                      {gevuld.map(o=><td key={o.id} style={{padding:"6px 12px",fontSize:12,fontFamily:T.mono,textAlign:"center",borderBottom:`0.5px solid ${T.borderSec}`,color:o[v.k]?T.text:T.textTer,background:o.id===winnaarId?`${T.accent}05`:"transparent"}}>{v.f(o[v.k])}</td>)}
                    </tr>
                  ))}
                  <tr style={{background:T.bgSec,borderTop:`1px solid ${T.border}`}}>
                    <td style={{padding:"9px 12px",fontSize:12,fontWeight:700,color:T.text,fontFamily:T.font}}>Totaalscore</td>
                    {gevuld.map(o=><td key={o.id} style={{padding:"9px 12px",textAlign:"center"}}><ScoreBalk score={scores[o.id]??0}/></td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Aanbeveling */}
      {winnaar?.aanbieder&&(scores[winnaarId]??0)>0&&(
        <div style={{background:T.accentBg,border:`1px solid ${T.accent}44`,borderRadius:12,padding:"14px 16px",marginBottom:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:T.accent,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3,fontFamily:T.font}}>★ Aanbevolen aanbieder</div>
              <div style={{fontSize:19,fontWeight:700,color:T.text,fontFamily:T.font,marginBottom:3}}>{winnaar.aanbieder}</div>
              <div style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>
                Score <strong style={{fontFamily:T.mono,color:T.accent}}>{scores[winnaarId]}</strong>/100 · Profiel: <strong>{{goedkoopst:"Goedkoopst",beste_dekking:"Beste dekking",meeste_keuze:"Meeste keuze"}[weging]}</strong>
              </div>
              <div style={{display:"flex",gap:6,marginTop:7,flexWrap:"wrap"}}>
                {winnaar.premie&&<span style={{fontSize:10,fontWeight:600,color:T.accent,background:"#fff",padding:"2px 7px",borderRadius:99,fontFamily:T.font}}>Premie {pct(winnaar.premie)}</span>}
                {winnaar.lifecycle&&<span style={{fontSize:10,fontWeight:600,color:T.blue,background:T.blueBg,padding:"2px 7px",borderRadius:99,fontFamily:T.font}}>{winnaar.lifecycle}</span>}
                {winnaar.nabestaanden&&<span style={{fontSize:10,fontWeight:500,color:T.textSec,background:T.bgSec,padding:"2px 7px",borderRadius:99,fontFamily:T.font}}>{winnaar.nabestaanden}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <OpslaanFooter info={`${aantalIngevuld} aanbieders ingevoerd`} onVolgende={onNaarC} labelVolgende="Naar beleggingsbeleid"/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE C — BELEGGINGSBELEID & LIFECYCLES
// ══════════════════════════════════════════════════════════════════
const LIFECYCLES = {
  "Nationale-Nederlanden":[{age:25,equity:85},{age:30,equity:85},{age:35,equity:80},{age:40,equity:75},{age:45,equity:65},{age:50,equity:52},{age:55,equity:38},{age:60,equity:22},{age:65,equity:10},{age:67,equity:5}],
  "ASR":                  [{age:25,equity:90},{age:30,equity:88},{age:35,equity:82},{age:40,equity:72},{age:45,equity:58},{age:50,equity:44},{age:55,equity:30},{age:60,equity:18},{age:65,equity:8},{age:67,equity:4}],
  "Aegon":                [{age:25,equity:80},{age:30,equity:80},{age:35,equity:76},{age:40,equity:70},{age:45,equity:60},{age:50,equity:48},{age:55,equity:35},{age:60,equity:20},{age:65,equity:10},{age:67,equity:5}],
  "Centraal Beheer":      [{age:25,equity:75},{age:30,equity:75},{age:35,equity:70},{age:40,equity:62},{age:45,equity:52},{age:50,equity:40},{age:55,equity:28},{age:60,equity:16},{age:65,equity:8},{age:67,equity:4}],
  "BrandNewDay":          [{age:25,equity:100},{age:30,equity:100},{age:35,equity:90},{age:40,equity:78},{age:45,equity:64},{age:50,equity:50},{age:55,equity:36},{age:60,equity:22},{age:65,equity:10},{age:67,equity:5}],
};
const AOW_MAAND = 1400;
const URM_RENDEMENTEN = { pessimistisch:0.01, verwacht:0.04, optimistisch:0.07 };
const INFLATIE_PERC = 0.02;
const DEMO_WN = { naam:"H. van Dijk", leeftijd:48, salaris:62000, franchise:17545, premiePerc:20, risicoProfiel:"neutraal" };

function equityOpLeeftijd(lft, lc) {
  const s=[...lc].sort((a,b)=>a.age-b.age);
  for(let i=0;i<s.length-1;i++){const a=s[i],b=s[i+1];if(lft>=a.age&&lft<=b.age){const t=(lft-a.age)/(b.age-a.age);return Math.round(a.equity+t*(b.equity-a.equity));}}
  return lft<=s[0].age?s[0].equity:s[s.length-1].equity;
}
function kapitaalNaarMaand(k){const r=0.02/12,n=240;return k*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);}
function berekenURMC({leeftijd,salaris,franchise,premiePerc,extraPerc=0,koopkracht=false}){
  const rj=Math.max(0,67-leeftijd),gs=Math.max(0,salaris-franchise),inleg=gs*((premiePerc+extraPerc)/100);
  const res={};
  Object.entries(URM_RENDEMENTEN).forEach(([n,r])=>{
    const fv=rj>0?((Math.pow(1+r,rj)-1)/r)*(1+r):1;
    let k=inleg*fv;
    if(koopkracht) k=k/Math.pow(1+INFLATIE_PERC,rj);
    res[n]=Math.max(0,kapitaalNaarMaand(k));
  });
  return res;
}

function UIMToggle({aan,onChange,label}){return(<button onClick={()=>onChange(!aan)} style={{display:"flex",alignItems:"center",gap:7,background:"none",border:"none",cursor:"pointer",padding:"3px 0"}}><div style={{width:34,height:18,borderRadius:99,background:aan?T.accent:T.border,position:"relative",transition:"background .2s",flexShrink:0}}><div style={{position:"absolute",top:1,left:aan?17:1,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/></div><span style={{fontSize:12,color:aan?T.text:T.textSec,fontFamily:T.font,fontWeight:aan?500:400}}>{label}</span></button>);}

function ModuleC({onTerug,onNaarAdvies}){
  const [aanbieder,setAanbieder]=useState("Nationale-Nederlanden");
  const [gesLCs,setGesLCs]=useState(["Nationale-Nederlanden","ASR","Centraal Beheer"]);
  const [koopkracht,setKoopkracht]=useState(false);
  const [extraInleg,setExtraInleg]=useState(0);
  const [doelPct,setDoelPct]=useState(70);
  const [opsStatus,setOpsStatus]=useState("idle");

  const toggleLC=n=>setGesLCs(p=>p.includes(n)?(p.length>1?p.filter(x=>x!==n):p):[...p,n]);
  const klrMap={"Nationale-Nederlanden":T.accent,"ASR":T.blue,"Aegon":T.warn,"Centraal Beheer":T.purple,"BrandNewDay":T.danger};

  const urm=useMemo(()=>berekenURMC({...DEMO_WN,extraPerc:extraInleg,koopkracht}),[extraInleg,koopkracht]);
  const doelMaand=(DEMO_WN.salaris/12)*(doelPct/100);
  const equity=equityOpLeeftijd(DEMO_WN.leeftijd,LIFECYCLES[aanbieder]||LIFECYCLES["Nationale-Nederlanden"]);
  const vastrentend=100-equity;
  const risicoL=equity>=70?{txt:"Hoog risico",k:T.danger,bg:T.dangerBg}:equity>=40?{txt:"Gemiddeld risico",k:T.warn,bg:T.warnBg}:{txt:"Laag risico",k:T.accent,bg:T.accentBg};

  const grafData=[
    {sc:"Pessimistisch",kleur:T.danger,aow:AOW_MAAND,pensioen:urm.pessimistisch,totaal:AOW_MAAND+urm.pessimistisch},
    {sc:"Verwacht",kleur:T.warn,aow:AOW_MAAND,pensioen:urm.verwacht,totaal:AOW_MAAND+urm.verwacht},
    {sc:"Optimistisch",kleur:T.accent,aow:AOW_MAAND,pensioen:urm.optimistisch,totaal:AOW_MAAND+urm.optimistisch},
  ];
  const pessimistischTekort=grafData[0].totaal<doelMaand;

  const lcData=[25,30,35,40,45,50,55,60,65,67].map(age=>{const row={age:`${age}`};Object.entries(LIFECYCLES).forEach(([n,lc])=>{row[n]=equityOpLeeftijd(age,lc);});return row;});

  const CTooltip=({active,payload,label})=>{if(!active||!payload?.length)return null;const d=grafData.find(g=>g.sc===label);return(<div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:11,fontFamily:T.font,boxShadow:"0 4px 12px rgba(0,0,0,.1)",minWidth:170}}><div style={{fontWeight:700,marginBottom:6,color:T.text}}>{label}</div><div style={{display:"flex",justifyContent:"space-between",gap:14,marginBottom:2}}><span style={{color:T.aow}}>AOW</span><span style={{fontFamily:T.mono,fontWeight:600}}>{eur(AOW_MAAND)}/mnd</span></div><div style={{display:"flex",justifyContent:"space-between",gap:14,marginBottom:2}}><span style={{color:d?.kleur}}>2e pijler</span><span style={{fontFamily:T.mono,fontWeight:600}}>{eur(d?.pensioen)}/mnd</span></div><div style={{borderTop:`1px solid ${T.borderSec}`,marginTop:5,paddingTop:5,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700}}>Totaal</span><span style={{fontFamily:T.mono,fontWeight:700}}>{eur(d?.totaal)}/mnd</span></div>{doelMaand>0&&<div style={{marginTop:3,fontSize:10,color:d?.totaal>=doelMaand?T.accent:T.danger}}>{d?.totaal>=doelMaand?`✓ Boven doel (${eur(doelMaand)}/mnd)`:`▼ ${eur(doelMaand-d?.totaal)}/mnd onder doel`}</div>}</div>);};

  const LCTooltip=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:11,fontFamily:T.font,boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}><div style={{fontWeight:600,marginBottom:5,color:T.text}}>Leeftijd {label} jaar</div>{payload.sort((a,b)=>b.value-a.value).map(p=>(<div key={p.name} style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}><div style={{width:7,height:7,borderRadius:"50%",background:p.color,flexShrink:0}}/><span style={{color:T.textSec,flex:1,fontSize:10}}>{p.name}</span><span style={{fontFamily:T.mono,fontWeight:600,color:T.text}}>{p.value}%</span></div>))}<div style={{marginTop:5,fontSize:9,color:T.textTer}}>Rest = vastrentend</div></div>);};

  const opslaan=()=>{setOpsStatus("saving");setTimeout(()=>{setOpsStatus("saved");setTimeout(()=>setOpsStatus("idle"),3000);},800);};

  return(
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:3,fontFamily:T.font}}>Analyse · Module 2.3</div>
          <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Beleggingsbeleid & Lifecycles</h2>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Lifecycle-vergelijking, URM-projecties in 3 scenario's en koppeling aan het risicoprofiel van de werkgever.</p>
        </div>
        <button onClick={onTerug} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:12,cursor:"pointer",fontFamily:T.font,color:T.textSec,flexShrink:0}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Terug
        </button>
      </div>

      {/* Context bar */}
      <div style={{background:T.bgSec,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"8px 14px",marginBottom:12,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font}}>Demo-werknemer</span>
        {[["Naam",DEMO_WN.naam],["Leeftijd",`${DEMO_WN.leeftijd} jaar`],["Salaris",eurCompact(DEMO_WN.salaris)],["Premie",`${DEMO_WN.premiePerc}%`],["Risicoprofiel",DEMO_WN.risicoProfiel]].map(([l,v])=>(
          <div key={l} style={{display:"flex",gap:4,alignItems:"center"}}>
            <span style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{l}:</span>
            <span style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Aanbieder selector */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:12,fontWeight:500,color:T.textSec,fontFamily:T.font,whiteSpace:"nowrap"}}>Aanbieder (uit 2.2)</span>
        <select value={aanbieder} onChange={e=>setAanbieder(e.target.value)} style={{flex:1,padding:"7px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none"}}>
          {Object.keys(LIFECYCLES).map(a=><option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* ── 1. Lifecycle grafiek ── */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Lifecycle-vergelijking: zakelijke waarden % per leeftijd</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:2,fontFamily:T.font}}>Hoger = meer risico en groeipotentieel. Lifecycle bouwt automatisch af richting pensioendatum (67 jr).</div>
        </div>
        <div style={{padding:"12px 16px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {Object.keys(LIFECYCLES).map(n=>{const sel=gesLCs.includes(n);const k=klrMap[n];return(<button key={n} onClick={()=>toggleLC(n)} style={{padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:500,border:`1px solid ${sel?k:T.border}`,background:sel?k:T.bgSec,color:sel?"#fff":T.textSec,cursor:"pointer",fontFamily:T.font}}>{n}</button>);})}
          </div>
          <div style={{height:200}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lcData} margin={{top:4,right:8,bottom:0,left:8}}>
                <XAxis dataKey="age" tick={{fontSize:10,fontFamily:T.font,fill:T.textTer}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>`${v}%`} tick={{fontSize:10,fontFamily:T.mono,fill:T.textTer}} axisLine={false} tickLine={false} domain={[0,100]} width={32}/>
                <Tooltip content={<LCTooltip/>}/>
                <ReferenceLine y={50} stroke={T.borderSec} strokeDasharray="4 4"/>
                {gesLCs.map(n=><Line key={n} type="monotone" dataKey={n} stroke={klrMap[n]} strokeWidth={2} dot={false} activeDot={{r:4}}/>)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{marginTop:8,padding:"7px 11px",background:T.bgSec,borderRadius:7,fontSize:11,color:T.textSec,fontFamily:T.font}}>
            <strong style={{color:T.text}}>Risicomapping:</strong> Werkgeversprofiel is <span style={{fontWeight:600,color:T.accent}}>Neutraal</span>. BrandNewDay (100% equity jong) past minder bij dit profiel dan Centraal Beheer.
          </div>
        </div>
      </div>

      {/* ── 4. Lifecycle tijdlijn ── */}
      <div style={{background:T.bgCard,border:`1px solid ${risicoL.k}44`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:`${risicoL.k}08`}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Lifecycle Risico-Tijdlijn</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:2,fontFamily:T.font}}>Actuele positie van {DEMO_WN.naam} ({DEMO_WN.leeftijd} jaar) in de lifecycle van {aanbieder}</div>
        </div>
        <div style={{padding:"14px 16px"}}>
          <div style={{position:"relative",marginBottom:16}}>
            <div style={{height:12,borderRadius:99,background:`linear-gradient(to right,${T.danger},${T.warn},${T.accent})`,opacity:0.15}}/>
            <div style={{position:"absolute",top:0,left:0,height:12,width:`${equity}%`,borderRadius:99,background:`linear-gradient(to right,${equity>=70?T.danger:T.warn},${T.accent})`,transition:"width .4s"}}/>
            <div style={{position:"absolute",top:-3,left:`${((DEMO_WN.leeftijd-25)/(67-25))*100}%`,transform:"translateX(-50%)"}}>
              <div style={{width:16,height:18,background:T.text,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:7,color:"#fff",fontFamily:T.mono,fontWeight:700}}>{DEMO_WN.leeftijd}</span>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              {[25,35,45,55,67].map(l=><span key={l} style={{fontSize:9,color:T.textTer,fontFamily:T.mono}}>{l}</span>)}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{background:risicoL.bg,border:`0.5px solid ${risicoL.k}44`,borderRadius:9,padding:"9px 12px"}}>
              <div style={{fontSize:9,color:risicoL.k,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2,fontFamily:T.font}}>Zakelijke waarden</div>
              <div style={{fontSize:24,fontWeight:700,color:risicoL.k,fontFamily:T.mono,lineHeight:1}}>{equity}%</div>
              <div style={{fontSize:10,color:risicoL.k,marginTop:1,fontFamily:T.font}}>{risicoL.txt}</div>
            </div>
            <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:9,padding:"9px 12px"}}>
              <div style={{fontSize:9,color:T.accent,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2,fontFamily:T.font}}>Vastrentend</div>
              <div style={{fontSize:24,fontWeight:700,color:T.accent,fontFamily:T.mono,lineHeight:1}}>{vastrentend}%</div>
              <div style={{fontSize:10,color:T.accent,marginTop:1,fontFamily:T.font}}>Beschermd kapitaal</div>
            </div>
          </div>
          <div style={{fontSize:12,color:T.textSec,fontFamily:T.font,lineHeight:1.6,padding:"8px 11px",background:T.bgSec,borderRadius:8}}>
            {equity>=40?`Het pensioengeld is voor ${equity}% in zakelijke waarden. Een beurscrisis is beperkt doordat ${vastrentend}% vastrentend is.`:`Het pensioengeld is voor ${vastrentend}% veiliggesteld in vastrentende waarden. Beperkt beursrisico, maar ook beperkter groeipotentieel.`}
          </div>
        </div>
      </div>

      {/* ── 2+3. URM + AOW stacking + koopkracht + repareer ── */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>URM-Projecties — Verwacht pensioen per maand</div>
          <div style={{fontSize:11,color:T.textSec,marginTop:2,fontFamily:T.font}}>{DEMO_WN.naam} · {DEMO_WN.leeftijd} jaar · {DEMO_WN.premiePerc}% premie · {aanbieder}</div>
        </div>
        <div style={{padding:"14px 16px"}}>
          {/* Controls */}
          <div style={{display:"flex",gap:20,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            <UIMToggle aan={koopkracht} onChange={setKoopkracht} label="Koopkrachtcorrectie (2% inflatie)"/>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>Doelstelling:</span>
              <input type="number" value={doelPct} onChange={e=>setDoelPct(+e.target.value)} min={40} max={100} step={5} style={{width:48,padding:"4px 6px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,color:T.text,background:T.bgSec,outline:"none",textAlign:"center"}}/>
              <span style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>% = <strong style={{fontFamily:T.mono,color:T.text}}>{eur(doelMaand)}/mnd</strong></span>
            </div>
          </div>
          {koopkracht&&<div style={{background:T.blueBg,border:`0.5px solid ${T.blue}44`,borderRadius:7,padding:"7px 11px",marginBottom:10,fontSize:11,color:T.blue,fontFamily:T.font}}>💡 Bedragen gecorrigeerd voor 2% inflatie over {67-DEMO_WN.leeftijd} jaar. Eerlijker vergelijking met de huidige regeling.</div>}

          {/* Gestapelde bar chart */}
          <div style={{height:220,marginBottom:10}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafData} margin={{top:12,right:20,bottom:0,left:20}} barSize={60}>
                <XAxis dataKey="sc" tick={{fontSize:12,fontFamily:T.font,fill:T.text}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>`€${(v/1000).toFixed(0)}k`} tick={{fontSize:10,fontFamily:T.mono,fill:T.textTer}} axisLine={false} tickLine={false} width={42}/>
                <Tooltip content={<CTooltip/>}/>
                {doelMaand>0&&<ReferenceLine y={doelMaand} stroke={T.blue} strokeDasharray="6 3" strokeWidth={1.5} label={{value:"Doel",position:"right",fontSize:10,fill:T.blue,fontFamily:T.font}}/>}
                <Bar dataKey="aow" stackId="a" fill={T.aow} fillOpacity={0.7}/>
                <Bar dataKey="pensioen" stackId="a" radius={[5,5,0,0]}>{grafData.map((g,i)=><Cell key={i} fill={g.kleur}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda */}
          <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
            {[{k:T.aow,l:`AOW (${eur(AOW_MAAND)}/mnd)`},{k:T.danger,l:"Pessimistisch (1%)"},{k:T.warn,l:"Verwacht (4%)"},{k:T.accent,l:"Optimistisch (7%)"}].map(x=>(
              <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:9,height:9,borderRadius:2,background:x.k,flexShrink:0}}/>
                <span style={{fontSize:10,color:T.textSec,fontFamily:T.font}}>{x.l}</span>
              </div>
            ))}
          </div>

          {/* Repareer slider */}
          {pessimistischTekort&&(
            <div style={{background:T.dangerBg,border:`1px solid ${T.danger}44`,borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:13,fontWeight:600,color:T.dangerText,fontFamily:T.font,marginBottom:3}}>⚠ Pessimistisch scenario ({eur(grafData[0].totaal)}/mnd) &lt; doelstelling ({eur(doelMaand)}/mnd)</div>
              <div style={{fontSize:11,color:T.dangerText,fontFamily:T.font,marginBottom:12}}>Sleep de slider om te zien hoeveel extra inleg nodig is om het tekort te dichten:</div>
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                  <span style={{fontSize:11,color:T.dangerText,fontFamily:T.font}}>Extra inleg</span>
                  <span style={{fontSize:20,fontWeight:700,color:T.dangerText,fontFamily:T.mono}}>{extraInleg.toFixed(1)}%</span>
                </div>
                <input type="range" min={0} max={8} step={0.5} value={extraInleg} onChange={e=>setExtraInleg(+e.target.value)} style={{width:"100%",accentColor:T.danger}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.dangerText,fontFamily:T.font,marginTop:1}}><span>+0%</span><span>+4%</span><span>+8%</span></div>
              </div>
              {extraInleg>0&&(()=>{const p=berekenURMC({...DEMO_WN,extraPerc:extraInleg,koopkracht});const tot=AOW_MAAND+p.pessimistisch;const ok=tot>=doelMaand;return(<div style={{background:ok?T.accentBg:T.warnBg,border:`0.5px solid ${ok?T.accent:T.warn}44`,borderRadius:8,padding:"9px 11px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}><span style={{fontSize:12,color:ok?T.accent:T.warnText,fontFamily:T.font}}>{ok?"✓ Doelstelling gehaald!":"Nog niet voldoende"}</span><span style={{fontSize:15,fontWeight:700,fontFamily:T.mono,color:ok?T.accent:T.warnText}}>{eur(tot)}/mnd</span></div><div style={{fontSize:11,color:ok?T.accent:T.warnText,fontFamily:T.font}}>{ok?`Met +${extraInleg}% extra inleg is het pessimistische scenario (${eur(tot)}/mnd) boven de doelstelling.`:`Nog ${eur(doelMaand-tot)}/mnd tekort. Probeer een hogere inleg.`}</div></div>);})()} 
            </div>
          )}
          {!pessimistischTekort&&(
            <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:9,padding:"8px 11px",display:"flex",gap:8,alignItems:"center"}}>
              <span>✓</span><span style={{fontSize:12,color:T.accent,fontFamily:T.font}}>Zelfs het pessimistische scenario ({eur(grafData[0].totaal)}/mnd) is boven de doelstelling. Geen aanvullende actie nodig.</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14}}>
        <div style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>
          {opsStatus==="saved"?<span style={{color:T.accent,fontWeight:500}}>✓ Beleggingsanalyse opgeslagen in dossier</span>:"Lifecycle, URM-projecties en risicokoppeling worden opgeslagen"}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={opslaan} disabled={opsStatus==="saving"} style={{padding:"8px 15px",borderRadius:8,border:`1px solid ${opsStatus==="saved"?T.accent:T.border}`,background:opsStatus==="saved"?T.accentBg:T.bgSec,color:opsStatus==="saved"?T.accent:T.text,fontSize:13,fontWeight:500,cursor:opsStatus==="saving"?"not-allowed":"pointer",fontFamily:T.font,opacity:opsStatus==="saving"?0.6:1}}>
            {opsStatus==="saving"?"Opslaan…":opsStatus==="saved"?"✓ Opgeslagen":"Opslaan in dossier"}
          </button>
          <button onClick={onNaarAdvies} style={{padding:"8px 16px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",gap:6}}>
            Naar adviesrapport <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT — NAVIGATIE WRAPPER
// ══════════════════════════════════════════════════════════════════
export default function AnalyseModule() {
  const [module, setModule]         = useState("config-a");
  const [werknemers, setWerknemers] = useState(MOCK);
  const [showImport, setShowImport] = useState(false);
  const [config, setConfig]         = useState({ franchise:17545, vlakkePremie:20, compensatieFactor:1.0, scenario:"invaren" });

  useEffect(()=>{
    if(!document.getElementById("af-font")){
      const l=document.createElement("link");l.id="af-font";l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
      document.head.appendChild(l);
    }
  },[]);

  const TABS = [
    {id:"config-a",  n:"2.1", label:"Transitie",          actief:module==="config-a"||module==="resultaten-a"},
    {id:"module-b",  n:"2.2", label:"Productvergelijking", actief:module==="module-b"},
    {id:"module-c",  n:"2.3", label:"Beleggingsbeleid",    actief:module==="module-c"},
  ];

  return (
    <div style={{fontFamily:T.font,maxWidth:940,margin:"0 auto",padding:"24px",background:T.bg,minHeight:"100vh"}}>
      {/* Breadcrumb + tabs */}
      <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.textTer,marginBottom:20,fontFamily:T.font,flexWrap:"wrap"}}>
        <span>Oranje Techniek B.V.</span><span>/</span>
        <span>Adviestraject</span><span>/</span>
        <span style={{color:T.text,fontWeight:500}}>Analyse</span>
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          {TABS.map(t=>(
            <div key={t.id}
              onClick={()=>{
                if(t.id==="config-a") setModule("config-a");
                else if(t.id==="module-b") setModule("module-b");
                else if(t.id==="module-c") setModule("module-c");
              }}
              style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:500,fontFamily:T.font,
                background:t.actief?T.accent:T.bgSec, color:t.actief?"#fff":T.textTer,
                border:`0.5px solid ${t.actief?T.accent:T.border}`, cursor:"pointer"}}>
              {t.n} {t.label}
            </div>
          ))}
        </div>
      </div>

      {module==="config-a"&&<ConfigScherm config={config} setConfig={setConfig} werknemers={werknemers} onImport={()=>setShowImport(true)} onBerekenen={()=>setModule("resultaten-a")}/>}
      {module==="resultaten-a"&&<ResultatenScherm config={config} setConfig={setConfig} werknemers={werknemers} onTerug={()=>setModule("config-a")} onNaarB={()=>setModule("module-b")}/>}
      {module==="module-b"&&<ModuleB onTerug={()=>setModule("resultaten-a")} onNaarC={()=>setModule("module-c")}/>}
      {module==="module-c"&&<ModuleC onTerug={()=>setModule("module-b")} onNaarAdvies={()=>setModule("advies-placeholder")}/>}
      {module==="advies-placeholder"&&(
        <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:16,padding:"48px 32px",textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:12}}>📄</div>
          <div style={{fontSize:17,fontWeight:700,color:T.text,marginBottom:6,fontFamily:T.font}}>2.4 Adviesrapport — Word-export</div>
          <div style={{fontSize:13,color:T.textSec,maxWidth:420,margin:"0 auto",fontFamily:T.font}}>Het volledige Word-adviesrapport wordt automatisch samengesteld vanuit de inventarisatie en analysedata. Volgende sprint.</div>
          <button onClick={()=>setModule("module-c")} style={{marginTop:20,padding:"9px 18px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:13,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>← Terug naar beleggingsbeleid</button>
        </div>
      )}

      {showImport&&<ImportModal onClose={()=>setShowImport(false)} onImport={w=>{setWerknemers(w);setShowImport(false);}}/>}
    </div>
  );
}