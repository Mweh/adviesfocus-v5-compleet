import { useState, useRef } from "react";

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
// MOCK DATA
// ══════════════════════════════════════════════════════════════════
const KANTOOR = {
  naam:"Pensioenadvies Menkhorst B.V.",
  afm:"12345678",
  primairKleur:"#1d9e75",
  briefAanhef:"Geachte heer/mevrouw",
  briefAfsluiting:"Met vriendelijke groet,",
  toonWetsartikelen:true,
  abonnement:"Pro",
  abonnementPrijs:249,
  volgendeFaktuur:"2026-04-17",
  maxGebruikers:3,
};

const GEBRUIKERS = [
  {id:"u1",naam:"D. Wietzema Menkhorst",email:"dolf@menkhorst.nl",   rol:"beheerder",actief:true, twofa:true, dossiers:14,aangemeld:"2025-01-15",laasteActief:"2026-03-28"},
  {id:"u2",naam:"S. van der Berg",       email:"sara@menkhorst.nl",   rol:"adviseur", actief:true, twofa:true, dossiers:8, aangemeld:"2025-03-01",laasteActief:"2026-03-27"},
  {id:"u3",naam:"T. Hoekstra",           email:"tom@menkhorst.nl",    rol:"adviseur", actief:true, twofa:false,dossiers:3, aangemeld:"2026-01-10",laasteActief:"2026-03-25"},
  {id:"u4",naam:"L. Bakker",             email:"lotte@menkhorst.nl",  rol:"adviseur", actief:false,twofa:true, dossiers:0, aangemeld:"2025-11-20",laasteActief:"2026-02-01"},
];

const KLANTEN = [
  {id:"k1",naam:"Oranje Techniek B.V.",    adviseur:"D. Wietzema Menkhorst",fase:"beheer",   werknemers:45,alerts:2,instemming:87,documenten:6, kwartaal:"2026Q1",status:"actief",  kvk:"12345678"},
  {id:"k2",naam:"Bouwgroep De Vries",      adviseur:"S. van der Berg",       fase:"analyse",  werknemers:23,alerts:0,instemming:0, documenten:2, kwartaal:"2026Q1",status:"actief",  kvk:"87654321"},
  {id:"k3",naam:"Zorginstelling Oosterpoort",adviseur:"D. Wietzema Menkhorst",fase:"inventarisatie",werknemers:67,alerts:1,instemming:0,documenten:1,kwartaal:"2026Q1",status:"actief",kvk:"11223344"},
  {id:"k4",naam:"Transport Jansen BV",     adviseur:"T. Hoekstra",           fase:"rapport",  werknemers:12,alerts:0,instemming:0, documenten:4, kwartaal:"2026Q1",status:"actief",  kvk:"44332211"},
  {id:"k5",naam:"Metalektro Noord",        adviseur:"S. van der Berg",       fase:"beheer",   werknemers:31,alerts:1,instemming:94,documenten:8, kwartaal:"2025Q4",status:"actief",  kvk:"55667788"},
  {id:"k6",naam:"Horeca Groep Zeeland",    adviseur:"D. Wietzema Menkhorst", fase:"concept",  werknemers:19,alerts:0,instemming:0, documenten:0, kwartaal:null,    status:"concept", kvk:"99887766"},
];

const DOSSIERS = [
  {id:"AF-2026-0328-OT-001",type:"adviesrapport",klant:"Oranje Techniek B.V.",adviseur:"D. Wietzema Menkhorst",datum:"2026-03-28",status:"voltooid",gevalideerd:true},
  {id:"AF-2026-0325-OT-002",type:"inventarisatie",klant:"Oranje Techniek B.V.",adviseur:"D. Wietzema Menkhorst",datum:"2026-03-25",status:"voltooid",gevalideerd:true},
  {id:"AF-2026-0320-BV-001",type:"inventarisatie",klant:"Bouwgroep De Vries",adviseur:"S. van der Berg",datum:"2026-03-20",status:"concept",gevalideerd:false},
  {id:"AF-2026-0318-ZO-001",type:"audit",klant:"Zorginstelling Oosterpoort",adviseur:"D. Wietzema Menkhorst",datum:"2026-03-18",status:"review",gevalideerd:false},
  {id:"AF-2026-0315-TJ-001",type:"adviesrapport",klant:"Transport Jansen BV",adviseur:"T. Hoekstra",datum:"2026-03-15",status:"voltooid",gevalideerd:true},
  {id:"AF-2026-0310-MN-001",type:"beheer",klant:"Metalektro Noord",adviseur:"S. van der Berg",datum:"2026-03-10",status:"voltooid",gevalideerd:true},
];

const AUDIT_LOG = [
  {id:"l1",ts:"2026-03-28 14:32",gebruiker:"D. Wietzema Menkhorst",actie:"Adviesrapport gegenereerd",dossier:"AF-2026-0328-OT-001",klant:"Oranje Techniek B.V.",ip:"87.213.x.x"},
  {id:"l2",ts:"2026-03-28 09:15",gebruiker:"S. van der Berg",      actie:"CSV werknemers geïmporteerd",dossier:"AF-2026-0320-BV-001",klant:"Bouwgroep De Vries",ip:"87.213.x.x"},
  {id:"l3",ts:"2026-03-27 16:48",gebruiker:"D. Wietzema Menkhorst",actie:"Document gedeeld (download-link)",dossier:"-",klant:"Oranje Techniek B.V.",ip:"87.213.x.x"},
  {id:"l4",ts:"2026-03-27 11:20",gebruiker:"T. Hoekstra",          actie:"Inventarisatie opgeslagen (Module C)",dossier:"AF-2026-0315-TJ-001",klant:"Transport Jansen BV",ip:"87.213.x.x"},
  {id:"l5",ts:"2026-03-26 15:05",gebruiker:"Systeem",              actie:"URM scenarioset 2026Q1 geactiveerd",dossier:"-",klant:"-",ip:"-"},
  {id:"l6",ts:"2026-03-26 09:00",gebruiker:"D. Wietzema Menkhorst",actie:"Gebruiker T. Hoekstra uitgenodigd",dossier:"-",klant:"-",ip:"87.213.x.x"},
  {id:"l7",ts:"2026-03-25 14:10",gebruiker:"D. Wietzema Menkhorst",actie:"Franchise bijgewerkt naar € 17.545",dossier:"-",klant:"-",ip:"87.213.x.x"},
  {id:"l8",ts:"2026-03-24 10:30",gebruiker:"S. van der Berg",      actie:"Portaaluitnodiging verstuurd (45 werknemers)",dossier:"-",klant:"Oranje Techniek B.V.",ip:"87.213.x.x"},
];

const URM_SETS = [
  {kwartaal:"2026Q1",datum:"15 jan 2026",scenarios:20000,actief:true, bronbestand:"CP2022 P scenarioset 20K 2026Q1.xlsx"},
  {kwartaal:"2025Q4",datum:"14 okt 2025",scenarios:20000,actief:false,bronbestand:"CP2022 P scenarioset 20K 2025Q4.xlsx"},
  {kwartaal:"2025Q3",datum:"15 jul 2025",scenarios:20000,actief:false,bronbestand:"CP2022 P scenarioset 20K 2025Q3.xlsx"},
];

const PARAMETERS = [
  {id:"franchise",   naam:"Franchise (AOW-drempel)",  waarde:"€ 17.545",  jaar:"2026",bron:"Belastingdienst",    bijgewerkt:"2026-01-08",status:"actueel"},
  {id:"anw",         naam:"ANW-uitkering bruto/mnd",  waarde:"€ 1.643",   jaar:"2026",bron:"SVB",               bijgewerkt:"2026-01-08",status:"actueel"},
  {id:"staffel_min", naam:"Staffelpremie minimaal",    waarde:"5,4%",      jaar:"2026",bron:"Commissie Parameters",bijgewerkt:"2025-01-10",status:"actueel"},
  {id:"staffel_max", naam:"Staffelpremie maximaal",    waarde:"32,2%",     jaar:"2026",bron:"Commissie Parameters",bijgewerkt:"2025-01-10",status:"actueel"},
  {id:"max_premie",  naam:"Max. pensioenpremie",       waarde:"30%",       jaar:"2026",bron:"Wtp / Belastingdienst",bijgewerkt:"2023-07-01",status:"actueel"},
  {id:"cao_entries", naam:"CAO-codelijst entries",     waarde:"1.589",     jaar:"jan 2026",bron:"SZW",           bijgewerkt:"2026-01-15",status:"actueel"},
];

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
const datNL = s => new Date(s).toLocaleDateString("nl-NL",{day:"2-digit",month:"short",year:"numeric"});
const tsTrunc = s => s.substring(0,16);

function Pill({label,kleur,bg,small=false}){
  return <span style={{fontSize:small?9:10,fontWeight:600,color:kleur,background:bg,padding:small?"1px 6px":"2px 8px",borderRadius:99,fontFamily:T.font,textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{label}</span>;
}
function Toggle({aan,onChange}){
  return <button onClick={()=>onChange(!aan)} style={{width:38,height:20,borderRadius:99,background:aan?T.accent:T.border,position:"relative",border:"none",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
    <div style={{position:"absolute",top:2,left:aan?20:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
  </button>;
}
function Sectiekop({children}){
  return <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".07em",marginBottom:10,fontFamily:T.font}}>{children}</div>;
}
function Card({children,style={}}){
  return <div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,...style}}>{children}</div>;
}
function KpiCard({label,waarde,kleur=T.text,bg=T.bgCard,sub}){
  return <Card style={{padding:"12px 14px"}}>
    <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4,fontFamily:T.font}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:kleur,fontFamily:T.mono,lineHeight:1.1}}>{waarde}</div>
    {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:3,fontFamily:T.font}}>{sub}</div>}
  </Card>;
}
function SaveBtn({label="Opslaan",savedLabel="✓ Opgeslagen",onSave}){
  const [st,setSt]=useState("idle");
  return <button onClick={()=>{setSt("saving");setTimeout(()=>{setSt("saved");if(onSave)onSave();setTimeout(()=>setSt("idle"),2500);},700);}} disabled={st==="saving"}
    style={{padding:"9px 18px",borderRadius:8,border:"none",background:st==="saved"?T.accentBg:T.text,color:st==="saved"?T.accent:"#fff",fontSize:13,fontWeight:600,cursor:st==="saving"?"not-allowed":"pointer",fontFamily:T.font,opacity:st==="saving"?.6:1}}>
    {st==="saving"?"Opslaan…":st==="saved"?savedLabel:label}
  </button>;
}

const FASE_META = {
  concept:{l:"Concept",k:T.textTer,bg:T.bgSec},
  inventarisatie:{l:"Inventarisatie",k:T.blue,bg:T.blueBg},
  analyse:{l:"Analyse",k:T.warn,bg:T.warnBg},
  rapport:{l:"Rapport",k:T.purple,bg:T.purpleBg},
  beheer:{l:"Beheer & Nazorg",k:T.accent,bg:T.accentBg},
};

// ══════════════════════════════════════════════════════════════════
// TAB: OVERZICHT
// ══════════════════════════════════════════════════════════════════
function TabOverzicht({gebruikers,klanten}){
  const actGeb=gebruikers.filter(g=>g.actief).length;
  const totAlerts=klanten.reduce((s,k)=>s+k.alerts,0);
  const actKlanten=klanten.filter(k=>k.status==="actief").length;
  const geen2fa=gebruikers.filter(g=>g.actief&&!g.twofa).length;

  return <div>
    {/* Compliance-waarschuwing */}
    {geen2fa>0&&<div style={{background:T.dangerBg,border:`1px solid ${T.danger}44`,borderRadius:10,padding:"11px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:18}}>🔐</span>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:T.dangerText,fontFamily:T.font}}>{geen2fa} gebruiker{geen2fa>1?"s":""} zonder twee-factor-authenticatie</div>
        <div style={{fontSize:11,color:T.dangerText,fontFamily:T.font}}>Dit is een beveiligingsrisico. Dwing 2FA af via het tabblad Gebruikers.</div>
      </div>
      <Pill label="Actie vereist" kleur={T.dangerText} bg="#fff"/>
    </div>}

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
      <KpiCard label="Actieve klanten"    waarde={actKlanten}    kleur={T.text}        sub={`${klanten.length} totaal`}/>
      <KpiCard label="Actieve adviseurs"  waarde={actGeb}        kleur={T.blue}        sub={`${gebruikers.length} totaal`}/>
      <KpiCard label="Openstaande alerts" waarde={totAlerts}     kleur={totAlerts>0?T.warnText:T.accent} bg={totAlerts>0?T.warnBg:T.accentBg} sub="over alle klanten"/>
      <KpiCard label="2FA ontbreekt"      waarde={geen2fa}       kleur={geen2fa>0?T.dangerText:T.accent} bg={geen2fa>0?T.dangerBg:T.accentBg} sub="actieve gebruikers"/>
    </div>

    {/* Klanten per fase */}
    <Card style={{marginBottom:14,overflow:"hidden"}}>
      <div style={{padding:"11px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Klantportefeuille — fase-overzicht</div>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(FASE_META).map(([k,v])=>{
            const n=klanten.filter(c=>c.fase===k).length;
            return n>0&&<div key={k} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:v.k}}/>
              <span style={{fontSize:10,color:T.textSec,fontFamily:T.font}}>{v.l} ({n})</span>
            </div>;
          })}
        </div>
      </div>

      {/* Fase-balken */}
      <div style={{padding:"14px 16px"}}>
        {Object.entries(FASE_META).map(([fase,meta])=>{
          const inFase=klanten.filter(k=>k.fase===fase);
          if(!inFase.length) return null;
          return <div key={fase} style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <Pill label={meta.l} kleur={meta.k} bg={meta.bg} small/>
              <span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>{inFase.length} klant{inFase.length>1?"en":""}</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {inFase.map(k=>(
                <div key={k.id} style={{padding:"5px 10px",background:meta.bg,border:`0.5px solid ${meta.k}33`,borderRadius:7,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:T.text,fontFamily:T.font,fontWeight:500}}>{k.naam}</span>
                  {k.alerts>0&&<span style={{fontSize:10,fontWeight:700,color:T.warnText,background:T.warnBg,padding:"0px 5px",borderRadius:99}}>{k.alerts}</span>}
                </div>
              ))}
            </div>
          </div>;
        })}
      </div>
    </Card>

    {/* Gebruik per adviseur */}
    <Card>
      <div style={{padding:"11px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec}}>
        <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Gebruik per adviseur — {new Date().toLocaleString("nl-NL",{month:"long",year:"numeric"})}</div>
      </div>
      <div style={{padding:"8px 0"}}>
        {gebruikers.filter(g=>g.actief).map(g=>{
          const maxD=Math.max(...gebruikers.map(u=>u.dossiers));
          return <div key={g.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 16px",borderBottom:`0.5px solid ${T.borderSec}`}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:T.bgSec,border:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.text,flexShrink:0}}>
              {g.naam.split(" ").map(w=>w[0]).slice(0,2).join("")}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:2,fontFamily:T.font}}>{g.naam}</div>
              <div style={{height:5,background:T.bgSec,borderRadius:99,overflow:"hidden"}}>
                <div style={{width:`${(g.dossiers/maxD)*100}%`,height:"100%",background:T.accent,borderRadius:99}}/>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:T.mono}}>{g.dossiers}</div>
              <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>dossiers</div>
            </div>
            {!g.twofa&&<Pill label="2FA ontbreekt" kleur={T.dangerText} bg={T.dangerBg} small/>}
          </div>;
        })}
      </div>
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: KLANTEN
// ══════════════════════════════════════════════════════════════════
function TabKlanten(){
  const [zoek,setZoek]=useState("");
  const [filterFase,setFilterFase]=useState("alle");
  const [filterAdv,setFilterAdv]=useState("alle");

  const adviseurs=[...new Set(KLANTEN.map(k=>k.adviseur))];
  const gefilterd=KLANTEN.filter(k=>{
    if(zoek&&!k.naam.toLowerCase().includes(zoek.toLowerCase())) return false;
    if(filterFase!=="alle"&&k.fase!==filterFase) return false;
    if(filterAdv!=="alle"&&k.adviseur!==filterAdv) return false;
    return true;
  });

  return <div>
    {/* Filters */}
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      <input value={zoek} onChange={e=>setZoek(e.target.value)} placeholder="Zoek klant…"
        style={{flex:1,minWidth:160,padding:"7px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgCard,outline:"none"}}/>
      <select value={filterFase} onChange={e=>setFilterFase(e.target.value)}
        style={{padding:"7px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgCard,outline:"none"}}>
        <option value="alle">Alle fasen</option>
        {Object.entries(FASE_META).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
      </select>
      <select value={filterAdv} onChange={e=>setFilterAdv(e.target.value)}
        style={{padding:"7px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgCard,outline:"none"}}>
        <option value="alle">Alle adviseurs</option>
        {adviseurs.map(a=><option key={a} value={a}>{a}</option>)}
      </select>
      <span style={{fontSize:11,color:T.textTer,fontFamily:T.font,alignSelf:"center"}}>{gefilterd.length} klanten</span>
    </div>

    <Card style={{overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:T.bgSec}}>
          {["Klant","Adviseur","Fase","Werknemers","Alerts","Instemming","DNB-set",""].map(h=>(
            <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {gefilterd.map((k,i)=>{
            const fase=FASE_META[k.fase];
            return <tr key={k.id} style={{background:i%2===0?T.bgCard:T.bgSec}}>
              <td style={{padding:"9px 12px"}}>
                <div style={{fontSize:13,fontWeight:500,color:T.text,fontFamily:T.font}}>{k.naam}</div>
                <div style={{fontSize:10,color:T.textTer,fontFamily:T.mono}}>{k.kvk}</div>
              </td>
              <td style={{padding:"9px 12px",fontSize:11,color:T.textSec,fontFamily:T.font}}>{k.adviseur.split(" ").slice(-1)[0]}</td>
              <td style={{padding:"9px 12px"}}><Pill label={fase.l} kleur={fase.k} bg={fase.bg} small/></td>
              <td style={{padding:"9px 12px",fontSize:12,fontFamily:T.mono,color:T.textSec,textAlign:"center"}}>{k.werknemers}</td>
              <td style={{padding:"9px 12px",textAlign:"center"}}>
                {k.alerts>0
                  ?<span style={{fontSize:12,fontWeight:700,color:T.warnText,background:T.warnBg,padding:"1px 7px",borderRadius:99,fontFamily:T.mono}}>{k.alerts}</span>
                  :<span style={{fontSize:12,color:T.textTer,fontFamily:T.mono}}>—</span>}
              </td>
              <td style={{padding:"9px 12px"}}>
                {k.instemming>0
                  ?<div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{flex:1,height:5,background:T.bgSec,borderRadius:99,overflow:"hidden",maxWidth:60}}>
                      <div style={{width:`${k.instemming}%`,height:"100%",background:k.instemming===100?T.accent:T.warn,borderRadius:99}}/>
                    </div>
                    <span style={{fontSize:10,fontFamily:T.mono,color:T.textSec}}>{k.instemming}%</span>
                  </div>
                  :<span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>Niet gestart</span>}
              </td>
              <td style={{padding:"9px 12px",fontSize:10,fontFamily:T.mono,color:k.kwartaal?T.textSec:T.textTer}}>
                {k.kwartaal||"—"}
              </td>
              <td style={{padding:"9px 12px"}}>
                <button style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>
                  Open →
                </button>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: GEBRUIKERS
// ══════════════════════════════════════════════════════════════════
function TabGebruikers(){
  const [gebruikers,setGebruikers]=useState(GEBRUIKERS);
  const [naam,setNaam]=useState("");
  const [email,setEmail]=useState("");
  const [rol,setRol]=useState("adviseur");
  const [verzonden,setVerzonden]=useState(false);
  const [twoFaModal,setTwoFaModal]=useState(null);

  const toggle=(id)=>setGebruikers(p=>p.map(g=>g.id===id?{...g,actief:!g.actief}:g));
  const stuur=()=>{if(!naam||!email)return;setVerzonden(true);setNaam("");setEmail("");setTimeout(()=>setVerzonden(false),3000);};

  const actief=gebruikers.filter(g=>g.actief).length;
  const geen2fa=gebruikers.filter(g=>g.actief&&!g.twofa).length;

  return <div>
    {geen2fa>0&&<div style={{background:T.dangerBg,border:`1px solid ${T.danger}44`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:T.dangerText,fontFamily:T.font,display:"flex",alignItems:"center",gap:8}}>
      🔐 <strong>{geen2fa} gebruiker{geen2fa>1?"s":""} zonder 2FA.</strong> Stuur een herinnering om 2FA te activeren. Zolang 2FA niet actief is, kan de gebruiker geen nieuwe dossiers aanmaken.
    </div>}

    {/* Uitnodigen */}
    <Card style={{padding:"16px",marginBottom:14}}>
      <Sectiekop>Nieuwe gebruiker uitnodigen</Sectiekop>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto auto",gap:10,alignItems:"end"}}>
        {[["Naam","text",naam,setNaam,"D. Wietzema Menkhorst"],["E-mailadres","email",email,setEmail,"naam@kantoor.nl"]].map(([l,t,v,s,ph])=>(
          <div key={l}>
            <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:4,fontFamily:T.font}}>{l}</label>
            <input type={t} value={v} onChange={e=>s(e.target.value)} placeholder={ph}
              style={{width:"100%",padding:"8px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none",boxSizing:"border-box"}}/>
          </div>
        ))}
        <div>
          <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:4,fontFamily:T.font}}>Rol</label>
          <select value={rol} onChange={e=>setRol(e.target.value)} style={{padding:"8px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none"}}>
            <option value="adviseur">Adviseur</option>
            <option value="beheerder">Beheerder</option>
          </select>
        </div>
        <button onClick={stuur} style={{padding:"8px 16px",borderRadius:8,border:"none",background:verzonden?T.accentBg:T.accent,color:verzonden?T.accent:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>
          {verzonden?"✓ Verzonden":"+ Uitnodigen"}
        </button>
      </div>
      <div style={{fontSize:11,color:T.textTer,marginTop:8,fontFamily:T.font}}>Uitgenodigde gebruiker ontvangt een magic link. 2FA is verplicht bij eerste inlog.</div>
    </Card>

    {/* Gebruikerslijst */}
    <Card style={{overflow:"hidden"}}>
      <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>{gebruikers.length} gebruikers — {actief} actief</span>
        <span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>Basisabonnement: {KANTOOR.maxGebruikers} seats inbegrepen · extra €49/mnd</span>
      </div>
      {gebruikers.map((g,i)=>(
        <div key={g.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<gebruikers.length-1?`0.5px solid ${T.borderSec}`:"none",opacity:g.actief?1:0.5}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:T.bgSec,border:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.text,flexShrink:0}}>
            {g.naam.split(" ").map(w=>w[0]).slice(0,2).join("")}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:500,color:T.text,fontFamily:T.font}}>{g.naam}</span>
              <Pill label={g.rol} kleur={g.rol==="beheerder"?T.accent:T.blue} bg={g.rol==="beheerder"?T.accentBg:T.blueBg} small/>
              {!g.twofa&&g.actief&&<Pill label="2FA ontbreekt" kleur={T.dangerText} bg={T.dangerBg} small/>}
            </div>
            <div style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>{g.email} · {g.dossiers} dossiers · Lid: {datNL(g.aangemeld)} · Actief: {datNL(g.laasteActief)}</div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            {!g.twofa&&g.actief&&(
              <button onClick={()=>setTwoFaModal(g)} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.danger}`,background:T.dangerBg,color:T.dangerText,fontSize:11,cursor:"pointer",fontFamily:T.font}}>
                2FA afdwingen
              </button>
            )}
            <button onClick={()=>toggle(g.id)} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:g.actief?T.dangerText:T.accent,fontWeight:500}}>
              {g.actief?"Blokkeren":"Activeren"}
            </button>
          </div>
        </div>
      ))}
    </Card>

    {/* 2FA modal */}
    {twoFaModal&&<div style={{position:"fixed",inset:0,background:"rgba(15,15,14,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setTwoFaModal(null)}>
      <div style={{background:T.bgCard,borderRadius:14,width:420,padding:24,boxShadow:"0 24px 64px rgba(0,0,0,.22)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:6,fontFamily:T.font}}>2FA afdwingen — {twoFaModal.naam}</div>
        <div style={{fontSize:12,color:T.textSec,marginBottom:16,fontFamily:T.font}}>Stuur een e-mail naar {twoFaModal.email} met de instructie om twee-factor-authenticatie te activeren. Tot activatie kan de gebruiker geen nieuwe dossiers aanmaken.</div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={()=>setTwoFaModal(null)} style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:12,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>Annuleren</button>
          <button onClick={()=>setTwoFaModal(null)} style={{padding:"8px 16px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Herinnering sturen</button>
        </div>
      </div>
    </div>}
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: PARAMETERS
// ══════════════════════════════════════════════════════════════════
function TabParameters(){
  const [params,setParams]=useState(PARAMETERS);
  const [editId,setEditId]=useState(null);
  const [editVal,setEditVal]=useState("");

  const startEdit=(p)=>{setEditId(p.id);setEditVal(p.waarde);};
  const slaOp=(id)=>{
    setParams(prev=>prev.map(p=>p.id===id?{...p,waarde:editVal,bijgewerkt:new Date().toISOString().slice(0,10)}:p));
    setEditId(null);
  };

  return <div>
    <div style={{background:T.warnBg,border:`0.5px solid ${T.warn}44`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:T.warnText,fontFamily:T.font}}>
      ⚠ Verouderde parameters leiden tot onjuiste berekeningen en compliance-risico. Controleer elk jaar in januari en elk kwartaal (DNB-set).
    </div>

    <Card style={{overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec}}>
        <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Parameterwaarden</div>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:T.bgSec}}>
          {["Parameter","Huidige waarde","Geldig voor","Bron","Bijgewerkt",""].map(h=>(
            <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {params.map((p,i)=>(
            <tr key={p.id} style={{background:i%2===0?T.bgCard:T.bgSec}}>
              <td style={{padding:"9px 12px",fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{p.naam}</td>
              <td style={{padding:"9px 12px"}}>
                {editId===p.id
                  ?<div style={{display:"flex",gap:6}}>
                    <input value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus
                      style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.accent}`,fontSize:13,fontFamily:T.mono,color:T.text,background:T.bgCard,outline:"none",width:120}}/>
                    <button onClick={()=>slaOp(p.id)} style={{padding:"4px 10px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>✓</button>
                    <button onClick={()=>setEditId(null)} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",color:T.textSec}}>×</button>
                  </div>
                  :<span style={{fontSize:13,fontWeight:700,fontFamily:T.mono,color:T.text}}>{p.waarde}</span>}
              </td>
              <td style={{padding:"9px 12px",fontSize:11,color:T.textSec,fontFamily:T.font}}>{p.jaar}</td>
              <td style={{padding:"9px 12px",fontSize:11,color:T.textTer,fontFamily:T.font}}>{p.bron}</td>
              <td style={{padding:"9px 12px",fontSize:11,fontFamily:T.mono,color:T.textSec}}>{datNL(p.bijgewerkt)}</td>
              <td style={{padding:"9px 12px"}}>
                {editId!==p.id&&<button onClick={()=>startEdit(p)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>Bewerken</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>

    <Card style={{padding:"14px 16px",background:T.blueBg,border:`0.5px solid ${T.blue}44`}}>
      <div style={{fontSize:12,fontWeight:600,color:T.blue,marginBottom:6,fontFamily:T.font}}>📅 Parameterkalender 2026</div>
      {[["Januari","Franchise + DNB Q1 bijwerken"],["April","DNB Q2 bijwerken"],["Juli","DNB Q3 + CAO-codelijst controleren"],["Oktober","DNB Q4 bijwerken"],["December","Jaarreviews plannen"]].map(([m,a])=>(
        <div key={m} style={{display:"flex",gap:12,padding:"4px 0",borderBottom:`0.5px solid ${T.blue}22`}}>
          <span style={{fontSize:11,fontWeight:600,color:T.blue,width:70,flexShrink:0,fontFamily:T.font}}>{m}</span>
          <span style={{fontSize:11,color:T.blue,fontFamily:T.font}}>{a}</span>
        </div>
      ))}
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: URM SCENARIOSET
// ══════════════════════════════════════════════════════════════════
function TabURM(){
  const [sets,setSets]=useState(URM_SETS);
  const [dragOver,setDragOver]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadPct,setUploadPct]=useState(0);
  const [uploadKlaar,setUploadKlaar]=useState(false);
  const fileRef=useRef(null);

  const activeer=(kwartaal)=>setSets(p=>p.map(s=>({...s,actief:s.kwartaal===kwartaal})));
  const actief=sets.find(s=>s.actief);

  const simuleerUpload=()=>{
    setUploading(true);setUploadPct(0);
    const steps=[10,25,45,65,80,95,100];
    let i=0;
    const iv=setInterval(()=>{
      setUploadPct(steps[i]);i++;
      if(i>=steps.length){clearInterval(iv);setUploading(false);setUploadKlaar(true);}
    },500);
  };

  return <div>
    {/* Actieve set */}
    <div style={{background:T.accentBg,border:`1px solid ${T.accent}44`,borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:20}}>✅</span>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:T.accent,fontFamily:T.font}}>Actieve scenarioset: {actief?.kwartaal}</div>
        <div style={{fontSize:11,color:T.accent,fontFamily:T.font}}>{actief?.scenarios.toLocaleString("nl-NL")} scenario's · Gepubliceerd {actief?.datum} · {actief?.bronbestand}</div>
      </div>
      <div style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>Volgende update: ~15 april 2026 (Q2)</div>
    </div>

    {/* Bestaande sets */}
    <Card style={{overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec}}>
        <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Geïmporteerde scenariosets</div>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:T.bgSec}}>
          {["Kwartaal","Gepubliceerd","Scenario's","Bronbestand","Status",""].map(h=>(
            <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {sets.map((s,i)=>(
            <tr key={s.kwartaal} style={{background:i%2===0?T.bgCard:T.bgSec}}>
              <td style={{padding:"8px 12px",fontSize:13,fontWeight:700,fontFamily:T.mono,color:T.text}}>{s.kwartaal}</td>
              <td style={{padding:"8px 12px",fontSize:12,color:T.textSec,fontFamily:T.font}}>{s.datum}</td>
              <td style={{padding:"8px 12px",fontSize:12,fontFamily:T.mono,color:T.textSec}}>{s.scenarios.toLocaleString("nl-NL")}</td>
              <td style={{padding:"8px 12px",fontSize:10,fontFamily:T.mono,color:T.textTer,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.bronbestand}</td>
              <td style={{padding:"8px 12px"}}>
                {s.actief?<Pill label="Actief" kleur={T.accent} bg={T.accentBg} small/>:<Pill label="Archief" kleur={T.textTer} bg={T.bgSec} small/>}
              </td>
              <td style={{padding:"8px 12px"}}>
                {!s.actief&&<button onClick={()=>activeer(s.kwartaal)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>Activeren</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>

    {/* Upload nieuwe set */}
    <Card style={{padding:"16px"}}>
      <Sectiekop>Nieuwe scenarioset uploaden</Sectiekop>
      <div style={{fontSize:12,color:T.textSec,marginBottom:12,fontFamily:T.font}}>
        Upload het JSON-bestand gegenereerd door <code style={{fontFamily:T.mono,fontSize:11,background:T.bgSec,padding:"1px 5px",borderRadius:4}}>dnb_urm_extract.py</code>. Niet de originele DNB Excel.
      </div>

      {uploadKlaar?(
        <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:9,padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:6}}>✅</div>
          <div style={{fontSize:13,fontWeight:600,color:T.accent,fontFamily:T.font}}>Scenarioset succesvol geïmporteerd en geactiveerd</div>
          <button onClick={()=>{setUploadKlaar(false);setUploadPct(0);}} style={{marginTop:10,padding:"6px 14px",borderRadius:7,border:"none",background:T.accent,color:"#fff",fontSize:12,cursor:"pointer",fontFamily:T.font}}>Nieuwe upload</button>
        </div>
      ):uploading?(
        <div style={{padding:"20px 0",textAlign:"center"}}>
          <div style={{fontSize:13,color:T.textSec,marginBottom:10,fontFamily:T.font}}>Importeren naar Supabase…</div>
          <div style={{background:T.bgSec,borderRadius:99,height:8,overflow:"hidden",marginBottom:6,maxWidth:400,margin:"0 auto 6px"}}>
            <div style={{width:`${uploadPct}%`,height:"100%",background:T.accent,borderRadius:99,transition:"width .3s"}}/>
          </div>
          <div style={{fontSize:11,fontFamily:T.mono,color:T.textTer}}>{uploadPct}%</div>
        </div>
      ):(
        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);simuleerUpload();}}
          onClick={()=>fileRef.current?.click()}
          style={{border:`2px dashed ${dragOver?T.accent:T.border}`,borderRadius:10,padding:"24px",textAlign:"center",cursor:"pointer",background:dragOver?T.accentBg:T.bgSec}}>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={simuleerUpload}/>
          <div style={{fontSize:24,marginBottom:8}}>📄</div>
          <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>Sleep JSON hierheen of klik</div>
          <div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginTop:3}}>urm_lookup_2026Q2.json · gegenereerd door dnb_urm_extract.py</div>
        </div>
      )}
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: DOSSIERS
// ══════════════════════════════════════════════════════════════════
function TabDossiers(){
  const [filter,setFilter]=useState("alle");
  const [zoek,setZoek]=useState("");
  const type_meta={adviesrapport:{l:"Adviesrapport",k:T.accent,bg:T.accentBg},inventarisatie:{l:"Inventarisatie",k:T.blue,bg:T.blueBg},analyse:{l:"Analyse",k:T.warn,bg:T.warnBg},audit:{l:"Audit",k:T.purple,bg:T.purpleBg},beheer:{l:"Beheer",k:T.text,bg:T.bgSec}};
  const st_meta={voltooid:{l:"Voltooid",k:T.accent},review:{l:"Review",k:T.warn},concept:{l:"Concept",k:T.textTer}};
  const gefilterd=DOSSIERS.filter(d=>{
    if(filter!=="alle"&&d.type!==filter) return false;
    if(zoek&&!d.klant.toLowerCase().includes(zoek.toLowerCase())&&!d.adviseur.toLowerCase().includes(zoek.toLowerCase())) return false;
    return true;
  });

  return <div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <input value={zoek} onChange={e=>setZoek(e.target.value)} placeholder="Zoek klant of adviseur…"
        style={{flex:1,minWidth:160,padding:"7px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgCard,outline:"none"}}/>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {[["alle","Alle"],["adviesrapport","Rapport"],["inventarisatie","Inventarisatie"],["audit","Audit"],["beheer","Beheer"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${filter===k?T.accent:T.border}`,background:filter===k?T.accentBg:T.bgSec,color:filter===k?T.accent:T.textSec,fontSize:11,cursor:"pointer",fontFamily:T.font,fontWeight:filter===k?600:400}}>
            {l}
          </button>
        ))}
      </div>
    </div>

    <Card style={{overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:T.bgSec}}>
          {["Type","Klant","Adviseur","Datum","Status","Trace-ID"].map(h=>(
            <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {gefilterd.map((d,i)=>{
            const tm=type_meta[d.type]||{l:d.type,k:T.textTer,bg:T.bgSec};
            const sm=st_meta[d.status]||{l:d.status,k:T.textTer};
            return <tr key={d.id} style={{background:i%2===0?T.bgCard:T.bgSec}}>
              <td style={{padding:"8px 12px"}}><Pill label={tm.l} kleur={tm.k} bg={tm.bg} small/></td>
              <td style={{padding:"8px 12px",fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{d.klant}</td>
              <td style={{padding:"8px 12px",fontSize:11,color:T.textSec,fontFamily:T.font}}>{d.adviseur.split(" ").slice(-2).join(" ")}</td>
              <td style={{padding:"8px 12px",fontSize:11,fontFamily:T.mono,color:T.textSec,whiteSpace:"nowrap"}}>{datNL(d.datum)}</td>
              <td style={{padding:"8px 12px"}}><span style={{fontSize:11,fontWeight:600,color:sm.k,fontFamily:T.font}}>{sm.l}</span></td>
              <td style={{padding:"8px 12px",fontSize:10,fontFamily:T.mono,color:T.textTer}}>{d.id}</td>
            </tr>;
          })}
        </tbody>
      </table>
      <div style={{padding:"8px 14px",background:T.bgSec,borderTop:`0.5px solid ${T.border}`,fontSize:11,color:T.textTer,fontFamily:T.font}}>
        {gefilterd.length} dossiers · bewaarplicht 7 jaar (Wft art. 4:15)
      </div>
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: AUDIT-LOG
// ══════════════════════════════════════════════════════════════════
function TabAuditLog(){
  const [filter,setFilter]=useState("");

  const gefilterd=AUDIT_LOG.filter(l=>
    !filter||l.gebruiker.toLowerCase().includes(filter.toLowerCase())||l.actie.toLowerCase().includes(filter.toLowerCase())||l.klant.toLowerCase().includes(filter.toLowerCase())
  );

  return <div>
    <div style={{background:T.blueBg,border:`0.5px solid ${T.blue}44`,borderRadius:9,padding:"9px 13px",marginBottom:12,fontSize:12,color:T.blue,fontFamily:T.font}}>
      🔍 Het audit-log registreert alle acties per gebruiker. Dit is uw bewijslast bij een AFM-onderzoek. Logs worden 7 jaar bewaard.
    </div>

    <div style={{marginBottom:12}}>
      <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Zoek op gebruiker, actie of klant…"
        style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgCard,outline:"none",boxSizing:"border-box"}}/>
    </div>

    <Card style={{overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:T.bgSec}}>
          {["Tijdstip","Gebruiker","Actie","Klant / Dossier","IP"].map(h=>(
            <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {gefilterd.map((l,i)=>(
            <tr key={l.id} style={{background:i%2===0?T.bgCard:T.bgSec}}>
              <td style={{padding:"7px 12px",fontSize:11,fontFamily:T.mono,color:T.textTer,whiteSpace:"nowrap"}}>{tsTrunc(l.ts)}</td>
              <td style={{padding:"7px 12px",fontSize:11,fontWeight:500,color:T.text,fontFamily:T.font,whiteSpace:"nowrap"}}>{l.gebruiker}</td>
              <td style={{padding:"7px 12px",fontSize:11,color:T.text,fontFamily:T.font}}>{l.actie}</td>
              <td style={{padding:"7px 12px"}}>
                <div style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>{l.klant!=="-"?l.klant:""}</div>
                {l.dossier!=="-"&&<div style={{fontSize:10,fontFamily:T.mono,color:T.textTer}}>{l.dossier}</div>}
              </td>
              <td style={{padding:"7px 12px",fontSize:10,fontFamily:T.mono,color:T.textTer}}>{l.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{padding:"8px 14px",background:T.bgSec,borderTop:`0.5px solid ${T.border}`,fontSize:11,color:T.textTer,fontFamily:T.font}}>
        {gefilterd.length} regels weergegeven · Exporteer via Instellingen → AFM-export
      </div>
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: HUISSTIJL
// ══════════════════════════════════════════════════════════════════
function TabHuisstijl(){
  const [hs,setHs]=useState({...KANTOOR,primairKleur:"#1d9e75"});
  const kleuren=["#1d9e75","#185fa5","#5b4fcf","#e24b4a","#ef9f27","#0f0f0e","#6b2d6b","#854f0b"];

  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
    <div>
      <Card style={{padding:"16px",marginBottom:12}}>
        <Sectiekop>Primaire kleur</Sectiekop>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          {kleuren.map(k=>(
            <div key={k} onClick={()=>setHs(h=>({...h,primairKleur:k}))}
              style={{width:30,height:30,borderRadius:"50%",background:k,cursor:"pointer",border:hs.primairKleur===k?`3px solid ${T.text}`:"2px solid transparent",transform:hs.primairKleur===k?"scale(1.15)":"scale(1)",transition:"all .15s"}}/>
          ))}
          <input type="color" value={hs.primairKleur} onChange={e=>setHs(h=>({...h,primairKleur:e.target.value}))}
            style={{width:30,height:30,borderRadius:"50%",border:"none",cursor:"pointer",padding:0}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>Hex:</span>
          <input value={hs.primairKleur} onChange={e=>setHs(h=>({...h,primairKleur:e.target.value}))}
            style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,color:T.text,background:T.bgSec,outline:"none",width:90}}/>
        </div>
      </Card>

      <Card style={{padding:"16px",marginBottom:12}}>
        <Sectiekop>Briefopmaak</Sectiekop>
        {[["Briefaanhef","briefAanhef","tekst"],["Briefafsluiting","briefAfsluiting","tekst"]].map(([l,k])=>(
          <div key={k} style={{marginBottom:10}}>
            <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:4,fontFamily:T.font}}>{l}</label>
            <input value={hs[k]} onChange={e=>setHs(h=>({...h,[k]:e.target.value}))}
              style={{width:"100%",padding:"8px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none",boxSizing:"border-box"}}/>
          </div>
        ))}
      </Card>

      <Card style={{padding:"16px",marginBottom:12}}>
        <Sectiekop>Rapport-voorkeuren</Sectiekop>
        {[["Wetsartikelen tonen in output","toonWetsartikelen"],["Kennisbronnen tonen in output","toonKennisbronLabels"]].map(([l,k])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`0.5px solid ${T.borderSec}`}}>
            <span style={{fontSize:12,color:T.text,fontFamily:T.font}}>{l}</span>
            <Toggle aan={hs[k]||false} onChange={v=>setHs(h=>({...h,[k]:v}))}/>
          </div>
        ))}
      </Card>

      <SaveBtn label="Huisstijl opslaan"/>
    </div>

    {/* Preview */}
    <div style={{position:"sticky",top:70}}>
      <div style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,fontFamily:T.font}}>Live preview</div>
      <Card style={{overflow:"hidden",marginBottom:10}}>
        <div style={{height:4,background:hs.primairKleur}}/>
        <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.borderSec}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{width:60,height:16,background:T.bgSec,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:8,color:T.textTer}}>Uw logo</span></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,fontWeight:600,color:T.text}}>{KANTOOR.naam}</div><div style={{fontSize:9,color:T.textTer}}>Adviesrapport 2026</div></div>
        </div>
        <div style={{padding:"12px 16px"}}>
          <div style={{fontSize:11,fontWeight:600,color:hs.primairKleur,marginBottom:6}}>7. Aanbeveling</div>
          <div style={{fontSize:10,color:T.textSec,lineHeight:1.5}}>Op basis van het klantprofiel adviseren wij Nationale-Nederlanden…</div>
          {hs.toonWetsartikelen&&<span style={{fontSize:8,fontWeight:600,background:T.warnBg,color:T.warnText,padding:"1px 5px",borderRadius:4,marginTop:4,display:"inline-block"}}>Bgfo art. 80a</span>}
        </div>
        <div style={{padding:"6px 16px",background:T.bgSec,borderTop:`0.5px solid ${T.borderSec}`,fontSize:8,color:T.textTer,fontFamily:T.mono}}>Trace-ID: AF-2026-0328-OT-001 · Pagina 1 van 18</div>
      </Card>
      <Card style={{padding:"14px 16px"}}>
        <div style={{fontSize:11,color:T.text,lineHeight:1.7}}>
          <div style={{marginBottom:6}}>{hs.briefAanhef} A. de Vries,</div>
          <div style={{color:T.textSec,fontSize:10}}>Uw pensioen verandert door de Wet toekomst pensioenen…</div>
          <div style={{marginTop:10,fontWeight:600}}>{hs.briefAfsluiting}</div>
          <div style={{fontWeight:700,fontSize:12,color:hs.primairKleur}}>{KANTOOR.naam}</div>
        </div>
      </Card>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// TAB: ABONNEMENT
// ══════════════════════════════════════════════════════════════════
function TabAbonnement(){
  const actGeb=GEBRUIKERS.filter(g=>g.actief).length;
  const extraSeats=Math.max(0,actGeb-KANTOOR.maxGebruikers);
  const totaal=KANTOOR.abonnementPrijs+extraSeats*49;

  return <div style={{maxWidth:560}}>
    <Card style={{padding:"20px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:2,fontFamily:T.font}}>Pro-abonnement</div>
          <div style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>Actief · Volgende factuur {datNL(KANTOOR.volgendeFaktuur)}</div>
        </div>
        <span style={{fontSize:10,fontWeight:600,color:T.accent,background:T.accentBg,padding:"3px 9px",borderRadius:99,fontFamily:T.font}}>Actief</span>
      </div>

      <div style={{background:T.bgSec,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"14px 16px",marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10,fontFamily:T.font}}>Prijsopbouw</div>
        {[
          [`Basisabonnement (${KANTOOR.maxGebruikers} gebruikers)`,`€ ${KANTOOR.abonnementPrijs}`],
          ...(extraSeats>0?[[`${extraSeats} extra gebruiker${extraSeats>1?"s":""} × €49`,`€ ${extraSeats*49}`]]:[]),
        ].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`0.5px solid ${T.borderSec}`,fontSize:13}}>
            <span style={{color:T.textSec,fontFamily:T.font}}>{l}</span>
            <span style={{fontWeight:500,fontFamily:T.mono,color:T.text}}>{v}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0",fontSize:15}}>
          <span style={{fontWeight:600,color:T.text,fontFamily:T.font}}>Totaal per maand</span>
          <span style={{fontWeight:700,color:T.text,fontFamily:T.mono}}>€ {totaal}</span>
        </div>
      </div>

      {[
        ["Actieve gebruikers",`${actGeb} van ${Math.max(KANTOOR.maxGebruikers,actGeb)}`],
        ["Klanten","6"],
        ["Dossiers deze maand",`${DOSSIERS.length}`],
        ["Opslagruimte","1,2 GB van 10 GB"],
      ].map(([l,v])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`0.5px solid ${T.borderSec}`,fontSize:12}}>
          <span style={{color:T.textSec,fontFamily:T.font}}>{l}</span>
          <span style={{fontWeight:500,color:T.text,fontFamily:T.mono}}>{v}</span>
        </div>
      ))}

      <button style={{width:"100%",marginTop:16,padding:"10px",background:T.text,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
        Facturen en betaalgegevens →
      </button>
    </Card>

    <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:9,padding:"11px 14px",marginBottom:10,fontSize:12,color:T.accent,fontFamily:T.font}}>
      Extra gebruikers toevoegen via het tabblad <strong>Gebruikers</strong>. Extra seats worden automatisch verrekend op de volgende factuur.
    </div>

    <Card style={{padding:"16px",border:`0.5px solid ${T.danger}44`}}>
      <div style={{fontSize:13,fontWeight:600,color:T.dangerText,marginBottom:4,fontFamily:T.font}}>Abonnement opzeggen</div>
      <div style={{fontSize:12,color:T.textSec,marginBottom:12,fontFamily:T.font}}>Na opzegging behoudt u toegang tot het einde van de betaalde periode. Daarna worden alle dossiers 30 dagen bewaard conform Wft art. 4:15.</div>
      <button style={{padding:"7px 14px",background:"transparent",border:`0.5px solid ${T.danger}`,borderRadius:7,fontSize:12,color:T.dangerText,cursor:"pointer",fontFamily:T.font,fontWeight:500}}>
        Opzeggen via klantportaal
      </button>
    </Card>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════
const TABS = [
  {id:"overzicht",  icon:"📊", label:"Overzicht"},
  {id:"klanten",    icon:"🏢", label:"Klanten"},
  {id:"gebruikers", icon:"👤", label:"Gebruikers"},
  {id:"parameters", icon:"⚙️",  label:"Parameters"},
  {id:"urm",        icon:"📡", label:"URM-set"},
  {id:"dossiers",   icon:"📁", label:"Dossiers"},
  {id:"auditlog",   icon:"🔍", label:"Audit-log"},
  {id:"huisstijl",  icon:"🎨", label:"Huisstijl"},
  {id:"abonnement", icon:"💳", label:"Abonnement"},
];

export default function BeheerOmgeving(){
  const [tab,setTab]=useState("overzicht");

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:T.font}}>
      {/* Topbar */}
      <nav style={{background:T.bgCard,borderBottom:`0.5px solid ${T.border}`,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="22" height="22" rx="4" fill={T.text}/>
            <rect x="14" y="14" width="22" height="22" rx="4" fill="none" stroke={T.text} strokeWidth="1.5"/>
            <rect x="16" y="16" width="8" height="8" rx="1.5" fill="#fff"/>
          </svg>
          <span style={{fontSize:15,letterSpacing:"-.03em",color:T.text}}>
            <span style={{fontWeight:300}}>Advies</span><span style={{fontWeight:700}}>Focus</span>
          </span>
          <div style={{width:1,height:16,background:T.border}}/>
          <span style={{fontSize:12,color:T.textTer,fontWeight:500}}>Kantoor beheer</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:12,color:T.textSec}}>{KANTOOR.naam}</span>
          <div style={{width:30,height:30,borderRadius:"50%",background:T.accentBg,border:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.accent}}>DW</div>
          <button style={{background:"none",border:"none",fontSize:12,color:T.textSec,cursor:"pointer",fontFamily:T.font}}>← Naar app</button>
        </div>
      </nav>

      <div style={{display:"flex",minHeight:"calc(100vh - 52px)"}}>
        {/* Zijbalk */}
        <aside style={{width:200,background:T.bgCard,borderRight:`0.5px solid ${T.border}`,padding:"16px 8px",flexShrink:0,position:"sticky",top:52,height:"calc(100vh - 52px)",overflowY:"auto"}}>
          <div style={{fontSize:9,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".08em",padding:"0 10px",marginBottom:6,fontFamily:T.font}}>Kantoor</div>
          {TABS.slice(0,3).map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:"none",background:tab===t.id?T.accentBg:"transparent",color:tab===t.id?T.accent:T.textSec,fontSize:13,fontWeight:tab===t.id?600:400,cursor:"pointer",fontFamily:T.font,textAlign:"left",marginBottom:2}}>
              <span style={{fontSize:14}}>{t.icon}</span>{t.label}
            </button>
          ))}

          <div style={{fontSize:9,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".08em",padding:"12px 10px 6px",fontFamily:T.font}}>Compliance</div>
          {TABS.slice(3,7).map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:"none",background:tab===t.id?T.accentBg:"transparent",color:tab===t.id?T.accent:T.textSec,fontSize:13,fontWeight:tab===t.id?600:400,cursor:"pointer",fontFamily:T.font,textAlign:"left",marginBottom:2}}>
              <span style={{fontSize:14}}>{t.icon}</span>{t.label}
            </button>
          ))}

          <div style={{fontSize:9,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".08em",padding:"12px 10px 6px",fontFamily:T.font}}>Instellingen</div>
          {TABS.slice(7).map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:"none",background:tab===t.id?T.accentBg:"transparent",color:tab===t.id?T.accent:T.textSec,fontSize:13,fontWeight:tab===t.id?600:400,cursor:"pointer",fontFamily:T.font,textAlign:"left",marginBottom:2}}>
              <span style={{fontSize:14}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{flex:1,padding:24,minWidth:0}}>
          <div style={{marginBottom:16}}>
            <h2 style={{margin:"0 0 2px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>
              {TABS.find(t=>t.id===tab)?.icon} {TABS.find(t=>t.id===tab)?.label}
            </h2>
            <div style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>{KANTOOR.naam} · Beheeromgeving</div>
          </div>

          {tab==="overzicht"  && <TabOverzicht gebruikers={GEBRUIKERS} klanten={KLANTEN}/>}
          {tab==="klanten"    && <TabKlanten/>}
          {tab==="gebruikers" && <TabGebruikers/>}
          {tab==="parameters" && <TabParameters/>}
          {tab==="urm"        && <TabURM/>}
          {tab==="dossiers"   && <TabDossiers/>}
          {tab==="auditlog"   && <TabAuditLog/>}
          {tab==="huisstijl"  && <TabHuisstijl/>}
          {tab==="abonnement" && <TabAbonnement/>}
        </main>
      </div>
    </div>
  );
}
