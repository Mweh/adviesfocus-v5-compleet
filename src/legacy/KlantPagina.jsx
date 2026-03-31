import { useState } from "react";

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
  font:"'DM Sans', system-ui, sans-serif",
  mono:"'DM Mono', monospace",
};

// ══════════════════════════════════════════════════════════════════
// MOCK DATA — Oranje Techniek B.V.
// ══════════════════════════════════════════════════════════════════
const KLANT = {
  id:"k1",
  naam:"Oranje Techniek B.V.",
  kvk:"12345678",
  adres:"Parkstraat 12, 2514 JK Den Haag",
  contactpersoon:"J. de Vries",
  functie:"HR Manager",
  email:"j.devries@oranjetechniek.nl",
  telefoon:"070-123 4567",
  adviseur:"D. Wietzema Menkhorst",
  fase:"beheer",
  aangemaakt:"2026-01-15",
  cao:"Metaal en Techniek",
  bpf:"Geen BPF-plicht",
  uitvoerder:"Nationale-Nederlanden",
  loonsom:2923000,
  werknemers:45,
  dnbSet:"2026Q1",
};

const FASE_STAPPEN = [
  {id:"inventarisatie", label:"Inventarisatie",  icon:"📋", datum:"2026-01-22", klaar:true},
  {id:"analyse",        label:"Analyse",          icon:"📊", datum:"2026-02-08", klaar:true},
  {id:"rapport",        label:"Adviesrapport",    icon:"📄", datum:"2026-02-28", klaar:true},
  {id:"communicatie",   label:"Communicatie",     icon:"📨", datum:"2026-03-10", klaar:true},
  {id:"instemming",     label:"Instemming",       icon:"✍️", datum:"2026-03-20", klaar:false, actief:true},
  {id:"nazorg",         label:"Nazorg",           icon:"🔄", datum:null,         klaar:false},
];

const ALERTS = [
  {id:"a1",type:"instemming",prio:"hoog",titel:"D. Bakker heeft bezwaar ingediend",tekst:"Actie vereist — bespreek bezwaar en documenteer afhandeling.",werknemer:"D. Bakker",datum:"2026-03-26"},
  {id:"a2",type:"budget",   prio:"hoog",titel:"Pensioenlasten overschrijden budget",tekst:"Na salarisronde: €243.000/jr vs. budget €232.000. Herbereken of budget bijstellen.",werknemer:null,datum:"2026-03-27"},
  {id:"a3",type:"mutatie",  prio:"laag",titel:"3 mutaties wachten op goedkeuring",tekst:"CSV-upload 28 mrt: 2 salarisverhogingen, 1 nieuwe medewerker.",werknemer:null,datum:"2026-03-28"},
];

const WERKNEMERS = [
  {id:"w1",naam:"A. de Vries",  leeftijd:45,salaris:62000,instemming:"ingestemd",portaal:true, trigger:null},
  {id:"w2",naam:"B. Janssen",   leeftijd:38,salaris:44500,instemming:"verstuurd",portaal:true, trigger:null},
  {id:"w3",naam:"C. Peters",    leeftijd:52,salaris:71000,instemming:"niet_verstuurd",portaal:false,trigger:"15jr"},
  {id:"w4",naam:"D. Bakker",    leeftijd:29,salaris:38000,instemming:"bezwaar",  portaal:true, trigger:null},
  {id:"w5",naam:"E. Visser",    leeftijd:61,salaris:88000,instemming:"ingestemd",portaal:true, trigger:"5jr"},
  {id:"w6",naam:"F. de Boer",   leeftijd:34,salaris:42000,instemming:"verstuurd",portaal:false,trigger:null},
  {id:"w7",naam:"G. Meijer",    leeftijd:26,salaris:32000,instemming:"niet_verstuurd",portaal:false,trigger:null},
];

const DOCUMENTEN = [
  {id:"d1",naam:"Adviesrapport Q1 2026",type:"adviesrapport",datum:"2026-02-28",richting:"uit",downloads:2,status:"gedownload"},
  {id:"d2",naam:"Was-wordt brief — 45 werknemers",type:"brief",datum:"2026-03-10",richting:"uit",downloads:38,status:"deels gelezen"},
  {id:"d3",naam:"Jaarrekening 2024",type:"jaarrekening",datum:"2026-01-20",richting:"in",downloads:1,status:"ontvangen"},
  {id:"d4",naam:"Salarisoverzicht maart 2026",type:"salarisoverzicht",datum:"2026-03-28",richting:"in",downloads:1,status:"ontvangen"},
  {id:"d5",naam:"Auditrapport WTP 2025",type:"audit",datum:"2026-01-22",richting:"uit",downloads:1,status:"gedownload"},
  {id:"d6",naam:"Offertevergelijking aanbieders",type:"vergelijking",datum:"2026-02-15",richting:"uit",downloads:1,status:"gedownload"},
];

const TIJDLIJN = [
  {datum:"2026-03-28",actie:"Mutatie-import ontvangen (3 wijzigingen wachten op review)",type:"mutatie",gebruiker:"Systeem"},
  {datum:"2026-03-26",actie:"Bezwaar ingediend door D. Bakker via werknemersportaal",type:"instemming",gebruiker:"Portaal"},
  {datum:"2026-03-25",actie:"Was-wordt brief gelezen door 38 van 45 werknemers",type:"communicatie",gebruiker:"Portaal"},
  {datum:"2026-03-20",actie:"Portaaluitnodigingen verstuurd naar 45 werknemers",type:"communicatie",gebruiker:"D. Wietzema Menkhorst"},
  {datum:"2026-03-10",actie:"Was-wordt brief gegenereerd en gedeeld",type:"document",gebruiker:"D. Wietzema Menkhorst"},
  {datum:"2026-02-28",actie:"Adviesrapport gegenereerd en verstuurd naar J. de Vries",type:"rapport",gebruiker:"D. Wietzema Menkhorst"},
  {datum:"2026-02-08",actie:"Analyse voltooid: NN geadviseerd, score 82/100",type:"analyse",gebruiker:"D. Wietzema Menkhorst"},
  {datum:"2026-01-22",actie:"Inventarisatie voltooid — alle 4 modules afgerond",type:"inventarisatie",gebruiker:"D. Wietzema Menkhorst"},
  {datum:"2026-01-15",actie:"Klantdossier aangemaakt",type:"start",gebruiker:"D. Wietzema Menkhorst"},
];

const NOTITIES = [
  {id:"n1",datum:"2026-03-26",tekst:"Gebeld met J. de Vries over bezwaar D. Bakker. Werkgever wil persoonlijk gesprek faciliteren. Ik stuur concept-reactiebrief.",auteur:"D. Wietzema Menkhorst"},
  {id:"n2",datum:"2026-02-10",tekst:"NN akkoord gegeven op offerte. Contractdatum 1 juli 2026. Premie definitief 19,5%.",auteur:"D. Wietzema Menkhorst"},
];

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
const eur = n => new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n??0);
const eurC = n => {const v=n??0;if(v>=1e6)return`€\u00a0${(v/1e6).toLocaleString("nl-NL",{minimumFractionDigits:1,maximumFractionDigits:2})}\u00a0mln`;if(v>=1e3)return`€\u00a0${(v/1e3).toLocaleString("nl-NL",{minimumFractionDigits:0,maximumFractionDigits:1})}\u00a0k`;return eur(v);};
const datNL = s => new Date(s).toLocaleDateString("nl-NL",{day:"2-digit",month:"short",year:"numeric"});

function Pill({label,kleur,bg,small=false}){return<span style={{fontSize:small?9:10,fontWeight:600,color:kleur,background:bg,padding:small?"1px 6px":"2px 8px",borderRadius:99,fontFamily:T.font,textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{label}</span>;}
function Card({children,style={}}){return<div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,...style}}>{children}</div>;}
function Kop({children,sub,actie}){return<div style={{padding:"11px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div><div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>{children}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:1,fontFamily:T.font}}>{sub}</div>}</div>{actie}</div>;}

const INSTEMMING_META = {
  ingestemd:     {l:"✓ Ingestemd",   k:T.accent,     bg:T.accentBg},
  verstuurd:     {l:"Verstuurd",     k:T.blue,       bg:T.blueBg},
  niet_verstuurd:{l:"Niet verstuurd",k:T.textTer,    bg:T.bgSec},
  bezwaar:       {l:"⚠ Bezwaar",    k:T.dangerText, bg:T.dangerBg},
};
const ALERT_ICON = {instemming:"✍️",budget:"💰",mutatie:"👥",trigger:"⏰",cao:"📋"};
const DOC_ICON   = {adviesrapport:"📄",brief:"📨",jaarrekening:"📊",salarisoverzicht:"📋",audit:"🔍",vergelijking:"⚖️"};
const TL_KLEUR   = {mutatie:T.warn,instemming:T.danger,communicatie:T.blue,document:T.accent,rapport:T.purple,analyse:T.blue,inventarisatie:T.accent,start:T.textTer};

// ══════════════════════════════════════════════════════════════════
// VOLGENDE ACTIE BANNER — het brein van de klantpagina
// ══════════════════════════════════════════════════════════════════
function VolgendeActieBanner({alerts,werknemers}){
  const hoogAlerts = alerts.filter(a=>a.prio==="hoog");
  const bezwaar    = werknemers.find(w=>w.instemming==="bezwaar");
  const openMut    = alerts.find(a=>a.type==="mutatie");
  const nietVerst  = werknemers.filter(w=>w.instemming==="niet_verstuurd").length;

  // Prioriteit: bezwaar > budget > mutaties > portaal versturen
  if(bezwaar) return(
    <div style={{background:T.dangerBg,border:`1px solid ${T.danger}44`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:36,height:36,borderRadius:9,background:T.dangerBg,border:`1px solid ${T.danger}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚠</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:T.dangerText,fontFamily:T.font}}>Actie vereist: bezwaar van {bezwaar.naam}</div>
        <div style={{fontSize:11,color:T.dangerText,fontFamily:T.font,marginTop:2}}>Bespreek het bezwaar, documenteer de afhandeling en stuur een reactiebrief. Zolang bezwaar open staat loopt de instemmingstermijn door.</div>
      </div>
      <button style={{padding:"7px 14px",borderRadius:8,border:"none",background:T.danger,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>Reactiebrief opstellen</button>
    </div>
  );

  if(hoogAlerts.find(a=>a.type==="budget")) return(
    <div style={{background:T.warnBg,border:`1px solid ${T.warn}44`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
      <div style={{fontSize:20}}>💰</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:T.warnText,fontFamily:T.font}}>Budget-overschrijding gesignaleerd</div>
        <div style={{fontSize:11,color:T.warnText,fontFamily:T.font,marginTop:2}}>Pensioenlasten €243.000/jr overschrijden het vastgestelde budget van €232.000. Bespreek herziening of accepteer de afwijking na akkoord werkgever.</div>
      </div>
      <button style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${T.warn}`,background:"transparent",color:T.warnText,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>Naar alerts</button>
    </div>
  );

  if(openMut) return(
    <div style={{background:T.blueBg,border:`1px solid ${T.blue}44`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
      <div style={{fontSize:20}}>👥</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:T.blue,fontFamily:T.font}}>3 mutaties wachten op goedkeuring</div>
        <div style={{fontSize:11,color:T.blue,fontFamily:T.font,marginTop:2}}>Upload van 28 mrt bevat wijzigingen. Keur goed zodat de pensioengrondslag automatisch wordt herberekend.</div>
      </div>
      <button style={{padding:"7px 14px",borderRadius:8,border:"none",background:T.blue,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>Mutaties reviewen</button>
    </div>
  );

  if(nietVerst>0) return(
    <div style={{background:T.accentBg,border:`1px solid ${T.accent}44`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
      <div style={{fontSize:20}}>📨</div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:T.accent,fontFamily:T.font}}>Nog {nietVerst} werknemers zonder portaaluitnodiging</div>
        <div style={{fontSize:11,color:T.accent,fontFamily:T.font,marginTop:2}}>Stuur een portaaluitnodiging zodat ook zij kunnen instemmen.</div>
      </div>
      <button style={{padding:"7px 14px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>Uitnodigingen sturen</button>
    </div>
  );

  return(
    <div style={{background:T.accentBg,border:`1px solid ${T.accent}44`,borderRadius:10,padding:"11px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:16}}>✅</span>
      <span style={{fontSize:13,color:T.accent,fontFamily:T.font}}>Geen openstaande acties. Alles loopt conform planning.</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FASEBALK
// ══════════════════════════════════════════════════════════════════
function FaseBalk({stappen}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:0,overflow:"hidden"}}>
      {stappen.map((s,i)=>{
        const kleur = s.klaar?T.accent:s.actief?T.warn:T.textTer;
        const bg    = s.klaar?T.accentBg:s.actief?T.warnBg:T.bgSec;
        return(
          <div key={s.id} style={{flex:1,display:"flex",alignItems:"center"}}>
            <div style={{flex:1,padding:"8px 10px",background:bg,borderTop:`2px solid ${kleur}`,textAlign:"center"}}>
              <div style={{fontSize:14,marginBottom:1}}>{s.klaar?"✓":s.actief?"→":s.icon}</div>
              <div style={{fontSize:10,fontWeight:s.actief?700:500,color:kleur,fontFamily:T.font,lineHeight:1.2}}>{s.label}</div>
              {s.datum&&<div style={{fontSize:9,color:T.textTer,fontFamily:T.mono,marginTop:1}}>{datNL(s.datum)}</div>}
              {s.actief&&!s.datum&&<div style={{fontSize:9,color:T.warn,fontFamily:T.font,marginTop:1}}>In uitvoering</div>}
            </div>
            {i<stappen.length-1&&<div style={{width:12,height:2,background:stappen[i+1].klaar?T.accent:T.borderSec,flexShrink:0}}/>}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTIES
// ══════════════════════════════════════════════════════════════════

// ── 1. DOSSIER-OVERZICHT ──────────────────────────────────────────
function SectieDossier(){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {/* Linker kolom */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Card>
          <Kop>Klantgegevens</Kop>
          <div style={{padding:"12px 16px"}}>
            {[["KvK",KLANT.kvk],["Adres",KLANT.adres],["Contactpersoon",`${KLANT.contactpersoon} · ${KLANT.functie}`],["E-mail",KLANT.email],["Telefoon",KLANT.telefoon],["Adviseur",KLANT.adviseur]].map(([l,v])=>(
              <div key={l} style={{display:"flex",gap:10,padding:"4px 0",borderBottom:`0.5px solid ${T.borderSec}`}}>
                <span style={{fontSize:11,color:T.textTer,width:110,flexShrink:0,fontFamily:T.font}}>{l}</span>
                <span style={{fontSize:11,color:T.text,fontFamily:T.font,lineHeight:1.4}}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Kop>Pensioenregeling</Kop>
          <div style={{padding:"12px 16px"}}>
            {[["Uitvoerder",KLANT.uitvoerder],["CAO",KLANT.cao],["BPF",KLANT.bpf],["Loonsom",eurC(KLANT.loonsom)],["Werknemers",`${KLANT.werknemers}`],["DNB-set",KLANT.dnbSet]].map(([l,v])=>(
              <div key={l} style={{display:"flex",gap:10,padding:"4px 0",borderBottom:`0.5px solid ${T.borderSec}`}}>
                <span style={{fontSize:11,color:T.textTer,width:110,flexShrink:0,fontFamily:T.font}}>{l}</span>
                <span style={{fontSize:11,color:T.text,fontFamily:T.mono,fontWeight:l==="Loonsom"?700:400}}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Rechter kolom */}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <Card>
          <Kop>Instemming — samenvatting</Kop>
          <div style={{padding:"14px 16px"}}>
            {[["ingestemd","Ingestemd"],["verstuurd","Verstuurd"],["niet_verstuurd","Niet verstuurd"],["bezwaar","Bezwaar"]].map(([k,l])=>{
              const n=WERKNEMERS.filter(w=>w.instemming===k).length;
              const m=INSTEMMING_META[k];
              return(
                <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <Pill label={m.l} kleur={m.k} bg={m.bg} small/>
                  <div style={{flex:1,height:5,background:T.bgSec,borderRadius:99,overflow:"hidden"}}>
                    <div style={{width:`${(n/WERKNEMERS.length)*100}%`,height:"100%",background:m.k,borderRadius:99}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,fontFamily:T.mono,color:m.k,width:20,textAlign:"right"}}>{n}</span>
                </div>
              );
            })}
            <div style={{marginTop:8,padding:"7px 10px",background:T.bgSec,borderRadius:7,fontSize:11,color:T.textSec,fontFamily:T.font}}>
              {WERKNEMERS.filter(w=>w.instemming==="ingestemd").length} van {WERKNEMERS.length} werknemers ingestemd ({Math.round(WERKNEMERS.filter(w=>w.instemming==="ingestemd").length/WERKNEMERS.length*100)}%)
            </div>
          </div>
        </Card>

        <Card>
          <Kop>Openstaande alerts</Kop>
          <div style={{padding:"8px 0"}}>
            {ALERTS.map(a=>(
              <div key={a.id} style={{display:"flex",gap:10,padding:"9px 16px",borderBottom:`0.5px solid ${T.borderSec}`,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0}}>{ALERT_ICON[a.type]}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font,marginBottom:1}}>{a.titel}</div>
                  <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{datNL(a.datum)}</div>
                </div>
                <Pill label={a.prio} kleur={a.prio==="hoog"?T.dangerText:T.warnText} bg={a.prio==="hoog"?T.dangerBg:T.warnBg} small/>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── 2. ADVIESTRAJECT ─────────────────────────────────────────────
function SectieAdviestraject(){
  const [actief,setActief]=useState(null); // welke deelsectie is open

  const modules=[
    {id:"inventarisatie",icon:"📋",label:"Inventarisatie",status:"voltooid",datum:"2026-01-22",
      items:["Module A — Financiële positie ✓","Module B — Kennis/ervaring ✓ (Gemiddeld)","Module C — Doelstellingen ✓ (vlakke premie 20%)","Module D — Kader & verplichtingen ✓ (geen BPF)"],
      actie:null},
    {id:"analyse_21",icon:"📊",label:"2.1 WTP-Transitie",status:"voltooid",datum:"2026-02-01",
      items:["45 werknemers geïmporteerd","Scenario: Invaren","Compensatielast: € 312.000 totaal","Compensatiefactor: 1,0×"],
      actie:null},
    {id:"analyse_22",icon:"⚖️",label:"2.2 Productvergelijking",status:"voltooid",datum:"2026-02-05",
      items:["3 aanbieders vergeleken (AFM ✓)","Winnaar: Nationale-Nederlanden (82/100)","Scoremodel: Goedkoopst","Afgewezen: ASR (74), CB (68)"],
      actie:null},
    {id:"analyse_23",icon:"📈",label:"2.3 Beleggingsbeleid",status:"voltooid",datum:"2026-02-08",
      items:["Lifecycle: Neutraal","URM P50: €1.640 + AOW €1.400 = €3.040/mnd","DNB-set: 2026Q1","Risicomapping: Neutraal ✓"],
      actie:null},
    {id:"rapport",icon:"📄",label:"Adviesrapport",status:"voltooid",datum:"2026-02-28",
      items:["12 hoofdstukken gegenereerd","Verstuurd naar J. de Vries (gedownload ✓)","Trace-ID: AF-2026-0228-OT-001"],
      actie:"Rapport openen"},
  ];

  const statusKleur={voltooid:{k:T.accent,bg:T.accentBg,l:"✓ Voltooid"},concept:{k:T.warn,bg:T.warnBg,l:"Concept"},open:{k:T.blue,bg:T.blueBg,l:"Open"}};

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop sub="Flow 1 — Inventarisatie → Analyse → Adviesrapport"
        actie={<button style={{padding:"6px 12px",borderRadius:7,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Nieuw adviestraject</button>}>
        Adviestraject
      </Kop>
      <div style={{padding:"14px 16px"}}>
        {modules.map((m,i)=>(
          <div key={m.id}>
            <div onClick={()=>setActief(actief===m.id?null:m.id)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",cursor:"pointer",borderBottom:i<modules.length-1&&actief!==m.id?`0.5px solid ${T.borderSec}`:"none"}}>
              <span style={{fontSize:18,flexShrink:0}}>{m.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:T.text,fontFamily:T.font}}>{m.label}</div>
                {m.datum&&<div style={{fontSize:10,color:T.textTer,fontFamily:T.mono}}>{datNL(m.datum)}</div>}
              </div>
              <Pill label={statusKleur[m.status].l} kleur={statusKleur[m.status].k} bg={statusKleur[m.status].bg} small/>
              <span style={{fontSize:12,color:T.textTer}}>{actief===m.id?"▲":"▼"}</span>
            </div>
            {actief===m.id&&(
              <div style={{padding:"10px 0 14px 30px",borderBottom:`0.5px solid ${T.borderSec}`}}>
                {m.items.map(item=>(
                  <div key={item} style={{fontSize:11,color:T.textSec,fontFamily:T.font,padding:"2px 0"}}>• {item}</div>
                ))}
                {m.actie&&<button style={{marginTop:8,padding:"5px 12px",borderRadius:7,border:`1px solid ${T.accent}`,background:T.accentBg,color:T.accent,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>{m.actie}</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 3. WERKNEMERS ────────────────────────────────────────────────
function SectieWerknemers(){
  const [zoek,setZoek]=useState("");
  const [filterStatus,setFilterStatus]=useState("alle");
  const [herinnering,setHerinnering]=useState(null);

  const gefilterd=WERKNEMERS.filter(w=>{
    if(zoek&&!w.naam.toLowerCase().includes(zoek.toLowerCase())) return false;
    if(filterStatus!=="alle"&&w.instemming!==filterStatus) return false;
    return true;
  });

  const stuurHerinnering=id=>{setHerinnering(id);setTimeout(()=>setHerinnering(null),2500);};

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop sub={`${WERKNEMERS.length} werknemers · ${WERKNEMERS.filter(w=>w.instemming==="ingestemd").length} ingestemd`}
        actie={<div style={{display:"flex",gap:6}}>
          <button style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>CSV importeren</button>
          <button style={{padding:"5px 11px",borderRadius:7,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Portaal uitnodigen</button>
        </div>}>
        Werknemers & instemming
      </Kop>

      {herinnering&&<div style={{padding:"7px 16px",background:T.accentBg,borderBottom:`0.5px solid ${T.accent}44`,fontSize:11,color:T.accent,fontFamily:T.font}}>
        ✓ Herinnering verstuurd naar {WERKNEMERS.find(w=>w.id===herinnering)?.naam}
      </div>}

      <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.borderSec}`,display:"flex",gap:8}}>
        <input value={zoek} onChange={e=>setZoek(e.target.value)} placeholder="Zoek werknemer…"
          style={{flex:1,padding:"6px 10px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none"}}/>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none"}}>
          <option value="alle">Alle statussen</option>
          {Object.entries(INSTEMMING_META).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
        </select>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.bgSec}}>
            {["Naam","Leeftijd","Salaris","Portaal","Status","Trigger",""].map(h=>(
              <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {gefilterd.map((w,i)=>{
              const s=INSTEMMING_META[w.instemming];
              return(
                <tr key={w.id} style={{background:i%2===0?T.bgCard:T.bgSec}}>
                  <td style={{padding:"8px 12px",fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{w.naam}</td>
                  <td style={{padding:"8px 12px",fontSize:12,fontFamily:T.mono,color:T.textSec}}>{w.leeftijd}</td>
                  <td style={{padding:"8px 12px",fontSize:12,fontFamily:T.mono,color:T.textSec}}>{eur(w.salaris)}</td>
                  <td style={{padding:"8px 12px"}}>
                    {w.portaal
                      ?<span style={{fontSize:10,color:T.accent,fontFamily:T.font}}>✓ Geopend</span>
                      :<span style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>Niet geopend</span>}
                  </td>
                  <td style={{padding:"8px 12px"}}><Pill label={s.l} kleur={s.k} bg={s.bg} small/></td>
                  <td style={{padding:"8px 12px"}}>
                    {w.trigger&&<Pill label={w.trigger} kleur={T.warn} bg={T.warnBg} small/>}
                  </td>
                  <td style={{padding:"8px 12px"}}>
                    <div style={{display:"flex",gap:5}}>
                      {(w.instemming==="verstuurd"||w.instemming==="niet_verstuurd")&&(
                        <button onClick={()=>stuurHerinnering(w.id)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:10,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>↺</button>
                      )}
                      {w.instemming==="bezwaar"&&(
                        <button style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${T.danger}`,background:T.dangerBg,fontSize:10,cursor:"pointer",fontFamily:T.font,color:T.dangerText,fontWeight:600}}>Reactie</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── 4. DOCUMENTEN ────────────────────────────────────────────────
function SectieDocumenten(){
  const [gekopieerd,setGekopieerd]=useState(null);
  const kopieer=(id)=>{setGekopieerd(id);setTimeout(()=>setGekopieerd(null),2000);};

  const uit=DOCUMENTEN.filter(d=>d.richting==="uit");
  const inn=DOCUMENTEN.filter(d=>d.richting==="in");

  const DocLijst=({docs,richting})=>(
    <div style={{display:"flex",flexDirection:"column",gap:7}}>
      {docs.map(d=>(
        <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:T.bgSec,borderRadius:9,border:`0.5px solid ${T.border}`}}>
          <span style={{fontSize:18}}>{DOC_ICON[d.type]||"📄"}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{d.naam}</div>
            <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{datNL(d.datum)} · {richting==="uit"?`${d.downloads} download${d.downloads!==1?"s":""}`:"Ontvangen"}</div>
          </div>
          <Pill label={d.status} kleur={d.status.includes("gelezen")||d.status==="gedownload"?T.accent:T.textTer} bg={d.status.includes("gelezen")||d.status==="gedownload"?T.accentBg:T.bgSec} small/>
          {richting==="uit"&&<button onClick={()=>kopieer(d.id)} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${T.border}`,background:gekopieerd===d.id?T.accentBg:T.bgCard,color:gekopieerd===d.id?T.accent:T.textSec,fontSize:10,cursor:"pointer",fontFamily:T.font}}>
            {gekopieerd===d.id?"✓ Gekopieerd":"🔗 Link"}
          </button>}
        </div>
      ))}
    </div>
  );

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop sub="Twee-richtings documentuitwisseling"
        actie={<button style={{padding:"6px 12px",borderRadius:7,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>+ Document toevoegen</button>}>
        Documenten
      </Kop>
      <div style={{padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8,fontFamily:T.font}}>📤 Verstuurd naar klant</div>
          <DocLijst docs={uit} richting="uit"/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8,fontFamily:T.font}}>📥 Ontvangen van klant</div>
          <DocLijst docs={inn} richting="in"/>
          <button style={{width:"100%",marginTop:8,padding:"8px",borderRadius:8,border:`1.5px dashed ${T.border}`,background:T.bgSec,color:T.textSec,fontSize:11,cursor:"pointer",fontFamily:T.font}}>
            + Upload-link genereren voor werkgever
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── 5. ACTIVITEITENTIJDLIJN + NOTITIES ──────────────────────────
function SectieTijdlijnNotities(){
  const [nieuw,setNieuw]=useState("");
  const [notities,setNotities]=useState(NOTITIES);
  const [tab,setTab]=useState("tijdlijn");

  const voegToe=()=>{
    if(!nieuw.trim()) return;
    setNotities(p=>[{id:`n${Date.now()}`,datum:new Date().toISOString().slice(0,10),tekst:nieuw,auteur:"D. Wietzema Menkhorst"},...p]);
    setNieuw("");
  };

  return(
    <Card style={{overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:`0.5px solid ${T.borderSec}`}}>
        {[["tijdlijn","🕐 Activiteiten"],["notities","📝 Notities"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{flex:1,padding:"10px",border:"none",borderBottom:tab===k?`2px solid ${T.accent}`:"2px solid transparent",background:"transparent",fontSize:12,fontWeight:tab===k?600:400,color:tab===k?T.accent:T.textSec,cursor:"pointer",fontFamily:T.font}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="tijdlijn"&&(
        <div style={{padding:"14px 16px"}}>
          {TIJDLIJN.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:12,paddingBottom:14,position:"relative"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:TL_KLEUR[t.type]||T.textTer,flexShrink:0,marginTop:3}}/>
                {i<TIJDLIJN.length-1&&<div style={{width:1,flex:1,background:T.borderSec,marginTop:4}}/>}
              </div>
              <div style={{flex:1,paddingBottom:4}}>
                <div style={{fontSize:12,color:T.text,fontFamily:T.font,lineHeight:1.4}}>{t.actie}</div>
                <div style={{fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}>{datNL(t.datum)} · {t.gebruiker}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="notities"&&(
        <div style={{padding:"14px 16px"}}>
          <div style={{marginBottom:14}}>
            <textarea value={nieuw} onChange={e=>setNieuw(e.target.value)} placeholder="Nieuwe notitie toevoegen…" rows={3}
              style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
            <button onClick={voegToe} style={{marginTop:6,padding:"6px 14px",borderRadius:7,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Opslaan</button>
          </div>
          {notities.map(n=>(
            <div key={n.id} style={{padding:"10px 12px",background:T.bgSec,borderRadius:9,marginBottom:8,border:`0.5px solid ${T.border}`}}>
              <div style={{fontSize:12,color:T.text,fontFamily:T.font,lineHeight:1.5,marginBottom:4}}>{n.tekst}</div>
              <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{datNL(n.datum)} · {n.auteur}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// SNELLE ACTIES — altijd zichtbaar in de rechter kolom
// ══════════════════════════════════════════════════════════════════
function SnelleActies(){
  const acties=[
    {icon:"📋",label:"Inventarisatie openen",kleur:T.accent,   bg:T.accentBg},
    {icon:"📊",label:"Analyse openen",       kleur:T.blue,     bg:T.blueBg},
    {icon:"📄",label:"Rapport genereren",    kleur:T.purple,   bg:T.purpleBg},
    {icon:"📨",label:"Brief genereren",      kleur:T.accent,   bg:T.accentBg},
    {icon:"💬",label:"Deelnemersvraag",      kleur:T.blue,     bg:T.blueBg},
    {icon:"🔍",label:"Auditrapport",         kleur:T.warn,     bg:T.warnBg},
    {icon:"👥",label:"Mutatie-import",       kleur:T.text,     bg:T.bgSec},
    {icon:"📤",label:"Document delen",       kleur:T.accent,   bg:T.accentBg},
  ];

  const hulp=[
    {label:"RVU-toets"},{label:"DGA-berekening"},{label:"Pensioenleeftijd"},
    {label:"Derde pijler"},{label:"ANW-hiaat berekening"},{label:"WTP-deadline"},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Card style={{padding:"14px"}}>
        <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10,fontFamily:T.font}}>Snelle acties</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {acties.map(a=>(
            <button key={a.label}
              style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,border:`0.5px solid ${a.kleur}33`,background:a.bg,cursor:"pointer",fontFamily:T.font,textAlign:"left"}}>
              <span style={{fontSize:15}}>{a.icon}</span>
              <span style={{fontSize:12,fontWeight:500,color:a.kleur}}>{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card style={{padding:"14px"}}>
        <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8,fontFamily:T.font}}>Hulpmiddelen</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {hulp.map(h=>(
            <button key={h.label} style={{padding:"4px 9px",borderRadius:5,border:`0.5px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>
              {h.label}
            </button>
          ))}
        </div>
      </Card>

      <Card style={{padding:"14px",background:T.bgSec,border:`0.5px solid ${T.border}`}}>
        <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8,fontFamily:T.font}}>Dossierinfo</div>
        {[["Aangemaakt",datNL(KLANT.aangemaakt)],["Trace-ID","AF-2026-OT"],["Status","Actief"],["Bewaarplicht","tot 2033"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`0.5px solid ${T.borderSec}`}}>
            <span style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{l}</span>
            <span style={{fontSize:10,color:T.text,fontFamily:T.mono}}>{v}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT — KLANTPAGINA
// ══════════════════════════════════════════════════════════════════
export default function KlantPagina(){
  const [sectie,setSectie]=useState("dossier");

  const SECTIES=[
    {id:"dossier",     label:"Dossier"},
    {id:"traject",     label:"Adviestraject"},
    {id:"werknemers",  label:"Werknemers"},
    {id:"documenten",  label:"Documenten"},
    {id:"activiteiten",label:"Activiteiten"},
  ];

  const ingestemd=WERKNEMERS.filter(w=>w.instemming==="ingestemd").length;
  const totaal=WERKNEMERS.length;
  const pctInst=Math.round(ingestemd/totaal*100);

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:T.font}}>

      {/* Topbar */}
      <div style={{background:T.bgCard,borderBottom:`0.5px solid ${T.border}`,padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        {/* Breadcrumb */}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 0 0",fontSize:11,color:T.textTer}}>
          <span style={{cursor:"pointer",color:T.accent,fontWeight:500}}>← Alle klanten</span>
          <span>/</span>
          <span style={{color:T.text,fontWeight:600}}>{KLANT.naam}</span>
        </div>

        {/* Klant-header */}
        <div style={{display:"flex",alignItems:"flex-start",gap:16,padding:"10px 0 12px",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:11,background:T.accentBg,border:`1px solid ${T.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:T.accent,flexShrink:0}}>
              {KLANT.naam.split(" ").map(w=>w[0]).slice(0,2).join("")}
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:700,color:T.text,marginBottom:2,fontFamily:T.font}}>{KLANT.naam}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>KvK {KLANT.kvk}</span>
                <span style={{fontSize:11,color:T.textTer}}>·</span>
                <span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>{KLANT.uitvoerder}</span>
                <span style={{fontSize:11,color:T.textTer}}>·</span>
                <span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>{KLANT.contactpersoon}</span>
              </div>
            </div>
          </div>

          {/* Status chips */}
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{textAlign:"center",padding:"6px 12px",background:T.accentBg,borderRadius:8,border:`0.5px solid ${T.accent}44`}}>
              <div style={{fontSize:18,fontWeight:700,color:T.accent,fontFamily:T.mono,lineHeight:1}}>{pctInst}%</div>
              <div style={{fontSize:9,color:T.accent,fontFamily:T.font}}>Ingestemd</div>
            </div>
            <div style={{textAlign:"center",padding:"6px 12px",background:ALERTS.filter(a=>a.prio==="hoog").length>0?T.warnBg:T.bgSec,borderRadius:8,border:`0.5px solid ${ALERTS.filter(a=>a.prio==="hoog").length>0?T.warn:T.border}`}}>
              <div style={{fontSize:18,fontWeight:700,color:ALERTS.filter(a=>a.prio==="hoog").length>0?T.warnText:T.textTer,fontFamily:T.mono,lineHeight:1}}>{ALERTS.length}</div>
              <div style={{fontSize:9,color:ALERTS.filter(a=>a.prio==="hoog").length>0?T.warnText:T.textTer,fontFamily:T.font}}>Alerts</div>
            </div>
            <div style={{textAlign:"center",padding:"6px 12px",background:T.bgSec,borderRadius:8,border:`0.5px solid ${T.border}`}}>
              <div style={{fontSize:18,fontWeight:700,color:T.text,fontFamily:T.mono,lineHeight:1}}>{KLANT.werknemers}</div>
              <div style={{fontSize:9,color:T.textTer,fontFamily:T.font}}>Werknemers</div>
            </div>
            <div style={{textAlign:"center",padding:"6px 12px",background:T.blueBg,borderRadius:8,border:`0.5px solid ${T.blue}44`}}>
              <div style={{fontSize:14,fontWeight:700,color:T.blue,fontFamily:T.mono,lineHeight:1.3}}>Beheer</div>
              <div style={{fontSize:9,color:T.blue,fontFamily:T.font}}>Huidige fase</div>
            </div>
          </div>
        </div>

        {/* Fasebalk */}
        <FaseBalk stappen={FASE_STAPPEN}/>

        {/* Subnavigatie */}
        <div style={{display:"flex",gap:0,marginTop:1}}>
          {SECTIES.map(s=>(
            <button key={s.id} onClick={()=>setSectie(s.id)}
              style={{padding:"9px 16px",border:"none",borderBottom:sectie===s.id?`2px solid ${T.accent}`:"2px solid transparent",background:"transparent",fontSize:12,fontWeight:sectie===s.id?600:400,color:sectie===s.id?T.accent:T.textSec,cursor:"pointer",fontFamily:T.font}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 24px"}}>
        {/* Volgende actie banner */}
        <VolgendeActieBanner alerts={ALERTS} werknemers={WERKNEMERS}/>

        {/* Twee-kolom layout: content + snelle acties */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 240px",gap:20,alignItems:"start"}}>
          <div>
            {sectie==="dossier"     && <SectieDossier/>}
            {sectie==="traject"     && <SectieAdviestraject/>}
            {sectie==="werknemers"  && <SectieWerknemers/>}
            {sectie==="documenten"  && <SectieDocumenten/>}
            {sectie==="activiteiten"&& <SectieTijdlijnNotities/>}
          </div>

          {/* Rechter kolom: altijd zichtbaar */}
          <div style={{position:"sticky",top:220}}>
            <SnelleActies/>
          </div>
        </div>
      </div>
    </div>
  );
}
