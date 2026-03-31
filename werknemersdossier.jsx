import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
// MOCK DATA — H. van Dijk
// ══════════════════════════════════════════════════════════════════
const WN = {
  // A — Basisgegevens
  id:"w5", naam:"H. van Dijk", voornaam:"Henk",
  geboortejaar:1978, leeftijd:48,
  salaris:72000, parttimePerc:100, dienstjaren:14,
  email:"h.vandijk@oranjetechniek.nl",
  telefoon:"06-12345678",
  inDienstDatum:"2010-03-01",
  functie:"Senior Technicus",
  aangemaakt:"2026-01-22",

  // B — Pensioenopbouw huidig
  franchise:17545,
  premieOud:0.176,    // staffel 48jr
  premieNieuw:0.20,   // vlakke premie
  grondslagBruto:72000 - 17545,  // 54455
  opgebouwdKapitaal:189000,       // bij huidige uitvoerder per 1-1-2026
  peildatumKapitaal:"2026-01-01",
  uitvoerderHuidig:"ASR Nederland N.V.",
  polisNummer:"ASR-2010-VD-44821",

  // C — Vorige regeling(en)
  vorigeRegelingen:[
    {uitvoerder:"Nationale-Nederlanden",periode:"2005–2010",waarde:28500,status:"overgedragen",datum:"2010-06-15"},
    {uitvoerder:"Zwitserleven",periode:"2003–2005",waarde:8200, status:"slapend",datum:null},
  ],

  // D — Persoonlijke situatie
  burgelijkeStaat:"gehuwd",
  partnerGeboortejaar:1980,
  partnerLeeftijd:46,
  partnerInkomen:"tussen_anw_en_max", // "geen" | "onder_anw" | "tussen_anw_en_max" | "boven_max"
  bestaandeAnwVerzekering:false,
  kinderen:2,
  kinderenLeeftijden:[12,9],

  // E — Keuzes en besluiten
  lifecycleKeuze:"standaard",   // "standaard" | "offensief" | "defensief" | "eigen"
  hoogLaag:false,
  hoogLaagVerhouding:null,
  uitruilOpPp:false,
  uitruilBedrag:null,
  bedragIneens:false,
  bedragIneesPct:null,
  keuzeDatum:null,
  keuzeBegeleidDoor:null,

  // F — Communicatie en instemming
  portaalUitnodigingDatum:"2026-03-20",
  portaalGeopend:true,
  portaalGeopendDatum:"2026-03-21",
  wasWordtGelezen:true,
  wasWordtGelezenDatum:"2026-03-22",
  instemming:"ingestemd",
  instemmingDatum:"2026-03-24",
  instemmingIp:"87.213.x.x",
  bezwaar:false,
  bezwaarTekst:null,
  vragen:[
    {datum:"2026-03-23",vraag:"Wat gebeurt er met mijn opgebouwde kapitaal bij ASR?",antwoord:"Uw opgebouwde kapitaal van €189.000 wordt ingevaren naar de nieuwe regeling bij Nationale-Nederlanden.",antwoordDatum:"2026-03-23",beantwoordDoor:"D. Wietzema Menkhorst"},
  ],

  // G — Triggers en signalering
  triggers:[
    {type:"pensioen_19jr",label:"19 jaar voor pensioenleeftijd",prioriteit:"laag",datum:"2026-01-22",afgehandeld:true},
    {type:"anw_hiaat",label:"ANW-hiaat risico",prioriteit:"hoog",datum:"2026-01-22",afgehandeld:false},
    {type:"slaper",label:"Slaper bij Zwitserleven (€ 8.200)",prioriteit:"middel",datum:"2026-01-22",afgehandeld:false},
  ],

  // URM-data (uit DNB 2026Q1)
  urm:{ p5:1380, p50:1890, p95:2640 },
  aow:1400,
  doelPct:70,
};

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
const eur = n => new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n??0);
const eurC = n => {const v=n??0;if(v>=1e6)return`€\u00a0${(v/1e6).toLocaleString("nl-NL",{minimumFractionDigits:1,maximumFractionDigits:2})}\u00a0mln`;if(v>=1e3)return`€\u00a0${(v/1e3).toLocaleString("nl-NL",{minimumFractionDigits:0,maximumFractionDigits:1})}\u00a0k`;return eur(v);};
const pct  = n => `${(n*100).toFixed(1)}%`;
const datNL= s => s ? new Date(s).toLocaleDateString("nl-NL",{day:"2-digit",month:"short",year:"numeric"}) : "—";

function Pill({label,kleur,bg,small=false}){return<span style={{fontSize:small?9:10,fontWeight:600,color:kleur,background:bg,padding:small?"1px 6px":"2px 8px",borderRadius:99,fontFamily:T.font,textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{label}</span>;}
function Card({children,style={}}){return<div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,...style}}>{children}</div>;}
function Kop({icon,children,sub,actie,kleur}){return(
  <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {icon&&<span style={{fontSize:16}}>{icon}</span>}
      <div>
        <div style={{fontSize:13,fontWeight:600,color:kleur||T.text,fontFamily:T.font}}>{children}</div>
        {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:1,fontFamily:T.font}}>{sub}</div>}
      </div>
    </div>
    {actie}
  </div>
);}
function Rij({label,value,mono=false,kleur,bold=false}){return(
  <div style={{display:"flex",gap:10,padding:"5px 0",borderBottom:`0.5px solid ${T.borderSec}`}}>
    <span style={{fontSize:11,color:T.textTer,width:180,flexShrink:0,fontFamily:T.font}}>{label}</span>
    <span style={{fontSize:11,color:kleur||T.text,fontFamily:mono?T.mono:T.font,fontWeight:bold?700:400,lineHeight:1.4}}>{value||"—"}</span>
  </div>
);}
function Toggle({aan,onChange}){return<button onClick={()=>onChange&&onChange(!aan)} style={{width:36,height:18,borderRadius:99,background:aan?T.accent:"rgba(15,15,14,0.15)",position:"relative",border:"none",cursor:"pointer",flexShrink:0}}><div style={{position:"absolute",top:1,left:aan?19:1,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .15s",boxShadow:"0 1px 2px rgba(0,0,0,.2)"}}/></button>;}
function InvoerVeld({label,value,onChange,type="text",placeholder="",mono=false,required=false}){
  const [focus,setFocus]=useState(false);
  return(
    <div style={{marginBottom:10}}>
      <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:4,fontFamily:T.font}}>{label}{required&&<span style={{color:T.danger}}> *</span>}</label>
      <input type={type} value={value||""} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${focus?T.accent:T.border}`,fontSize:12,fontFamily:mono?T.mono:T.font,color:T.text,background:T.bgSec,outline:"none",boxSizing:"border-box"}}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}/>
    </div>
  );
}
function SelectVeld({label,value,onChange,opties,required=false}){return(
  <div style={{marginBottom:10}}>
    <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:4,fontFamily:T.font}}>{label}{required&&<span style={{color:T.danger}}> *</span>}</label>
    <select value={value||""} onChange={e=>onChange&&onChange(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none"}}>
      {opties.map(([v,l])=><option key={v} value={v}>{l}</option>)}
    </select>
  </div>
);}

// ══════════════════════════════════════════════════════════════════
// ANW-HIAAT ANALYSE
// ══════════════════════════════════════════════════════════════════
function anwHiaatAnalyse(wn){
  // ANW bruto 2026: €1.643/mnd. Recht op ANW als partner geen inkomen heeft > franchise
  // Geen ANW-recht als partner inkomen > ~€16.000/jr (ca. €1.333/mnd)
  const GRENS_LAAG = 0;
  const GRENS_HOOG = 16000;
  const ANW_BRUTO = 1643;

  if(wn.burgelijkeStaat==="alleenstaand") return {risico:false,reden:"Alleenstaand — geen ANW-situatie"};
  if(wn.partnerInkomen==="boven_max") return {risico:false,reden:"Partner verdient boven de ANW-grens — geen ANW-uitkering"};
  if(wn.bestaandeAnwVerzekering) return {risico:false,reden:"Bestaande ANW-hiaatverzekering aanwezig"};

  const hiaatMaand = wn.partnerInkomen==="geen"?ANW_BRUTO:wn.partnerInkomen==="onder_anw"?Math.round(ANW_BRUTO*0.6):Math.round(ANW_BRUTO*0.3);
  return {
    risico:true,
    hiaatMaand,
    reden:`Partner verdient ${wn.partnerInkomen==="onder_anw"?"onder":"tussen"} ANW-grens — mogelijke ANW-uitkering van ~${eur(hiaatMaand)}/mnd bij overlijden werknemer`,
    advies:"Overweeg ANW-hiaatverzekering via de werkgever of privé. Premie hangt af van leeftijd en inkomen partner.",
  };
}

// ══════════════════════════════════════════════════════════════════
// SECTIE A — BASISGEGEVENS
// ══════════════════════════════════════════════════════════════════
function SectieA({wn,onWijzig}){
  const grondslag = Math.max(0, wn.salaris - wn.franchise);
  const inlegOud  = Math.round(grondslag * wn.premieOud * (wn.parttimePerc/100));
  const inlegNieuw= Math.round(grondslag * wn.premieNieuw * (wn.parttimePerc/100));

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop icon="👤" sub="Arbeidsrechtelijke basisgegevens">Basisgegevens</Kop>
      <div style={{padding:"14px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,fontFamily:T.font}}>Persoon</div>
          <Rij label="Volledige naam" value={wn.naam}/>
          <Rij label="Geboortejaar" value={`${wn.geboortejaar} (${wn.leeftijd} jaar)`} mono/>
          <Rij label="Functie" value={wn.functie}/>
          <Rij label="E-mailadres" value={wn.email}/>
          <Rij label="Telefoon" value={wn.telefoon}/>
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,fontFamily:T.font}}>Arbeidsovereenkomst</div>
          <Rij label="In dienst per" value={datNL(wn.inDienstDatum)}/>
          <Rij label="Dienstjaren" value={`${wn.dienstjaren} jaar`} mono/>
          <Rij label="Bruto jaarsalaris" value={eur(wn.salaris)} mono bold/>
          <Rij label="Arbeidsomvang" value={`${wn.parttimePerc}%`} mono/>
          <Rij label="Pensioenleeftijd" value="67 jaar" mono/>
        </div>
      </div>

      <div style={{borderTop:`0.5px solid ${T.borderSec}`,padding:"14px 16px"}}>
        <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10,fontFamily:T.font}}>Pensioengrondslag berekening</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[[eur(wn.salaris),"Bruto salaris"],[eur(wn.franchise),"Franchise 2026"],[eurC(grondslag),"Pensioengrondslag",T.text,true],[`${wn.parttimePerc}%`,"Arbeidsomvang"]].map(([v,l,k,bold])=>(
            <div key={l} style={{background:T.bgSec,borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".04em",marginBottom:2,fontFamily:T.font}}>{l}</div>
              <div style={{fontSize:14,fontWeight:bold?700:600,color:k||T.textSec,fontFamily:T.mono}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:10}}>
          <div style={{flex:1,background:T.dangerBg,border:`0.5px solid ${T.danger}22`,borderRadius:8,padding:"8px 10px"}}>
            <div style={{fontSize:10,color:T.dangerText,textTransform:"uppercase",letterSpacing:".04em",marginBottom:2,fontFamily:T.font}}>Inleg oud (staffel {pct(wn.premieOud)})</div>
            <div style={{fontSize:14,fontWeight:700,color:T.dangerText,fontFamily:T.mono}}>{eur(inlegOud)}/jr</div>
          </div>
          <div style={{flex:1,background:T.accentBg,border:`0.5px solid ${T.accent}22`,borderRadius:8,padding:"8px 10px"}}>
            <div style={{fontSize:10,color:T.accent,textTransform:"uppercase",letterSpacing:".04em",marginBottom:2,fontFamily:T.font}}>Inleg nieuw (vlak {pct(wn.premieNieuw)})</div>
            <div style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:T.mono}}>{eur(inlegNieuw)}/jr</div>
          </div>
          <div style={{flex:1,background:inlegNieuw>inlegOud?T.accentBg:T.dangerBg,border:`0.5px solid ${inlegNieuw>inlegOud?T.accent:T.danger}22`,borderRadius:8,padding:"8px 10px"}}>
            <div style={{fontSize:10,color:inlegNieuw>inlegOud?T.accent:T.dangerText,textTransform:"uppercase",letterSpacing:".04em",marginBottom:2,fontFamily:T.font}}>Verschil per jaar</div>
            <div style={{fontSize:14,fontWeight:700,color:inlegNieuw>inlegOud?T.accent:T.dangerText,fontFamily:T.mono}}>{inlegNieuw>inlegOud?"▲":"▼"} {eur(Math.abs(inlegNieuw-inlegOud))}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTIE B — PENSIOENOPBOUW + URM
// ══════════════════════════════════════════════════════════════════
function SectieB({wn}){
  const doelMaand=(wn.salaris/12)*(wn.doelPct/100);
  const grafData=[
    {sc:"Slecht weer",aow:wn.aow,pensioen:wn.urm.p5,kleur:T.danger},
    {sc:"Verwacht",   aow:wn.aow,pensioen:wn.urm.p50,kleur:T.warn},
    {sc:"Goed weer",  aow:wn.aow,pensioen:wn.urm.p95,kleur:T.accent},
  ];

  const Tip=({active,payload,label})=>{
    if(!active||!payload?.length) return null;
    const d=grafData.find(g=>g.sc===label);
    return<div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:11,fontFamily:T.font}}>
      <div style={{fontWeight:700,marginBottom:4,color:T.text}}>{label}</div>
      <div style={{color:T.aow,marginBottom:2}}>AOW: {eur(wn.aow)}/mnd</div>
      <div style={{color:d?.kleur,marginBottom:2}}>Pensioen: {eur(d?.pensioen)}/mnd</div>
      <div style={{color:T.text,fontWeight:700}}>Totaal: {eur((d?.aow||0)+(d?.pensioen||0))}/mnd</div>
    </div>;
  };

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop icon="📊" sub="Huidige opbouw en URM-projecties (DNB 2026Q1)">Pensioenopbouw & Projecties</Kop>
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px",marginBottom:14}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,fontFamily:T.font}}>Huidige polis</div>
            <Rij label="Uitvoerder" value={wn.uitvoerderHuidig}/>
            <Rij label="Polisnummer" value={wn.polisNummer} mono/>
            <Rij label="Opgebouwd kapitaal" value={`${eur(wn.opgebouwdKapitaal)} (per ${datNL(wn.peildatumKapitaal)})`} bold/>
            <Rij label="Nog op te bouwen" value={`${67-wn.leeftijd} jaar`} mono/>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,fontFamily:T.font}}>Doelstelling</div>
            <Rij label="Gewenst inkomen" value={`${wn.doelPct}% van huidig salaris`}/>
            <Rij label="Doelbedrag (bruto/mnd)" value={eur(doelMaand)} mono bold/>
            <Rij label="DNB-scenarioset" value={`2026Q1 (20.000 scenario's)`}/>
          </div>
        </div>

        {/* URM grafiek */}
        <div style={{height:180,marginBottom:10}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grafData} barSize={56} margin={{top:8,right:16,bottom:0,left:16}}>
              <XAxis dataKey="sc" tick={{fontSize:11,fontFamily:T.font,fill:T.text}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`€${Math.round(v/100)*100}`} tick={{fontSize:9,fontFamily:T.mono,fill:T.textTer}} axisLine={false} tickLine={false} width={42}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="aow" stackId="a" fill={T.aow} fillOpacity={0.65}/>
              <Bar dataKey="pensioen" stackId="a" radius={[4,4,0,0]}>{grafData.map((g,i)=><Cell key={i} fill={g.kleur}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {grafData.map(g=>(
            <div key={g.sc} style={{background:g.sc==="Verwacht"?T.warnBg:g.sc==="Goed weer"?T.accentBg:T.dangerBg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
              <div style={{fontSize:10,color:g.kleur,marginBottom:2,fontFamily:T.font}}>{g.sc}</div>
              <div style={{fontSize:15,fontWeight:700,color:g.kleur,fontFamily:T.mono}}>{eur(g.aow+g.pensioen)}</div>
              <div style={{fontSize:9,color:g.kleur,fontFamily:T.font}}>per maand incl. AOW</div>
              <div style={{fontSize:9,color:g.kleur,marginTop:2,fontFamily:T.font,fontWeight:600}}>
                {(g.aow+g.pensioen)>=doelMaand?"✓ Boven doel":`▼ ${eur(doelMaand-(g.aow+g.pensioen))} onder doel`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTIE C — VORIGE REGELINGEN
// ══════════════════════════════════════════════════════════════════
function SectieC({wn,onWijzig}){
  const [toonForm,setToonForm]=useState(false);
  const [nieuweUitv,setNieuweUitv]=useState("");
  const [nieuwePeriode,setNieuwePeriode]=useState("");
  const [nieuweWaarde,setNieuweWaarde]=useState("");
  const [nieuweStatus,setNieuweStatus]=useState("slapend");

  const totaalElders=wn.vorigeRegelingen.reduce((s,r)=>s+r.waarde,0);

  const statusMeta={overgedragen:{k:T.accent,bg:T.accentBg,l:"Overgedragen"},slapend:{k:T.warnText,bg:T.warnBg,l:"⚠ Slapend"},onbekend:{k:T.textTer,bg:T.bgSec,l:"Onbekend"}};

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop icon="📋" sub={`${wn.vorigeRegelingen.length} eerdere dienstverbanden · ${eurC(totaalElders)} elders opgebouwd`}
        actie={<button onClick={()=>setToonForm(f=>!f)} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>+ Toevoegen</button>}>
        Vorige regelingen & slapers
      </Kop>
      <div style={{padding:"14px 16px"}}>

        {wn.vorigeRegelingen.map((r,i)=>{
          const sm=statusMeta[r.status]||statusMeta.onbekend;
          return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:T.bgSec,borderRadius:9,marginBottom:8,border:`0.5px solid ${r.status==="slapend"?T.warn:T.border}`}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font,marginBottom:2}}>{r.uitvoerder}</div>
                <div style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>Periode: {r.periode}{r.datum&&` · Overgedragen: ${datNL(r.datum)}`}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:T.mono}}>{eur(r.waarde)}</div>
                <div style={{fontSize:9,color:T.textTer,fontFamily:T.font}}>opgebouwde waarde</div>
              </div>
              <Pill label={sm.l} kleur={sm.k} bg={sm.bg} small/>
              {r.status==="slapend"&&<button style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${T.warn}`,background:T.warnBg,color:T.warnText,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>WO aanvragen</button>}
            </div>
          );
        })}

        {wn.vorigeRegelingen.some(r=>r.status==="slapend")&&(
          <div style={{background:T.warnBg,border:`0.5px solid ${T.warn}44`,borderRadius:8,padding:"9px 12px",fontSize:11,color:T.warnText,fontFamily:T.font}}>
            ⚠ Slaper gesignaleerd. Overweeg waardeoverdracht naar de nieuwe regeling bij {wn.uitvoerderHuidig==="ASR Nederland N.V."?"Nationale-Nederlanden":wn.uitvoerderHuidig}. Een WO-verzoek kan het totale eindkapitaal verhogen en de administratieve last verlagen.
          </div>
        )}

        {toonForm&&(
          <div style={{background:T.bgSec,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"14px",marginTop:10}}>
            <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:10,fontFamily:T.font}}>Vorige regeling toevoegen</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
              <InvoerVeld label="Uitvoerder" value={nieuweUitv} onChange={setNieuweUitv} placeholder="Nationale-Nederlanden"/>
              <InvoerVeld label="Periode (bijv. 2005–2010)" value={nieuwePeriode} onChange={setNieuwePeriode} placeholder="2005–2010"/>
              <InvoerVeld label="Opgebouwde waarde (€)" value={nieuweWaarde} onChange={setNieuweWaarde} placeholder="28500" type="number" mono/>
              <SelectVeld label="Status" value={nieuweStatus} onChange={setNieuweStatus} opties={[["slapend","Slapend"],["overgedragen","Overgedragen"],["onbekend","Onbekend"]]}/>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button onClick={()=>setToonForm(false)} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bgCard,fontSize:12,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>Annuleren</button>
              <button onClick={()=>setToonForm(false)} style={{padding:"7px 14px",borderRadius:7,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Opslaan</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTIE D — PERSOONLIJKE SITUATIE + ANW
// ══════════════════════════════════════════════════════════════════
function SectieD({wn,onWijzig}){
  const [data,setData]=useState(wn);
  const [bewerken,setBewerken]=useState(false);
  const upd=(k,v)=>setData(d=>({...d,[k]:v}));

  const anw=useMemo(()=>anwHiaatAnalyse(data),[data]);

  const partnerInkomenOpties=[["geen","Geen inkomen"],["onder_anw","Inkomen < ANW-grens (< €16.000/jr)"],["tussen_anw_en_max","Inkomen tussen ANW-grens en max"],["boven_max","Inkomen boven maximum — geen ANW-recht"]];
  const burgelijkeStaatOpties=[["gehuwd","Gehuwd / geregistreerd partnerschap"],["samenwonend","Samenwonend (notarieel)"],["alleenstaand","Alleenstaand"],["onbekend","Onbekend"]];

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop icon="👨‍👩‍👧" sub="Burgerlijke staat, partner en ANW-hiaat analyse"
        actie={<button onClick={()=>setBewerken(b=>!b)} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>
          {bewerken?"✓ Sluiten":"Bewerken"}
        </button>}>
        Persoonlijke situatie
      </Kop>
      <div style={{padding:"14px 16px"}}>

        {bewerken?(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
            <div>
              <SelectVeld label="Burgerlijke staat" value={data.burgelijkeStaat} onChange={v=>upd("burgelijkeStaat",v)} opties={burgelijkeStaatOpties} required/>
              {data.burgelijkeStaat!=="alleenstaand"&&<>
                <InvoerVeld label="Geboortejaar partner" value={data.partnerGeboortejaar} onChange={v=>upd("partnerGeboortejaar",+v)} type="number" mono required/>
                <SelectVeld label="Inkomen partner" value={data.partnerInkomen} onChange={v=>upd("partnerInkomen",v)} opties={partnerInkomenOpties} required/>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:6,fontFamily:T.font}}>Bestaande ANW-hiaatverzekering</label>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Toggle aan={data.bestaandeAnwVerzekering} onChange={v=>upd("bestaandeAnwVerzekering",v)}/>
                    <span style={{fontSize:12,color:T.text,fontFamily:T.font}}>{data.bestaandeAnwVerzekering?"Ja — aanwezig":"Nee — niet verzekerd"}</span>
                  </div>
                </div>
              </>}
              <InvoerVeld label="Aantal kinderen" value={data.kinderen} onChange={v=>upd("kinderen",+v)} type="number" mono/>
            </div>
            <div>
              {/* ANW preview live */}
              {anw.risico?(
                <div style={{background:T.dangerBg,border:`1px solid ${T.danger}44`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.dangerText,marginBottom:4,fontFamily:T.font}}>⚠ ANW-hiaat gesignaleerd</div>
                  <div style={{fontSize:11,color:T.dangerText,marginBottom:8,fontFamily:T.font}}>{anw.reden}</div>
                  <div style={{fontSize:13,fontWeight:700,color:T.dangerText,fontFamily:T.mono}}>~{eur(anw.hiaatMaand)}/mnd</div>
                  <div style={{fontSize:9,color:T.dangerText,fontFamily:T.font}}>potentieel gemiste ANW-uitkering</div>
                  <div style={{marginTop:8,fontSize:11,color:T.dangerText,fontFamily:T.font}}>{anw.advies}</div>
                </div>
              ):(
                <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.accent,fontFamily:T.font}}>✓ Geen ANW-hiaat risico</div>
                  <div style={{fontSize:11,color:T.accent,marginTop:4,fontFamily:T.font}}>{anw.reden}</div>
                </div>
              )}
            </div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
            <div>
              <Rij label="Burgerlijke staat" value={{gehuwd:"Gehuwd / geregistreerd partnerschap",samenwonend:"Samenwonend (notarieel)",alleenstaand:"Alleenstaand",onbekend:"Onbekend"}[data.burgelijkeStaat]}/>
              {data.burgelijkeStaat!=="alleenstaand"&&<>
                <Rij label="Geboortejaar partner" value={`${data.partnerGeboortejaar} (${data.partnerLeeftijd} jaar)`} mono/>
                <Rij label="Inkomen partner" value={({geen:"Geen inkomen",onder_anw:"< ANW-grens",tussen_anw_en_max:"Tussen ANW-grens en max",boven_max:"Boven maximum"})[data.partnerInkomen]}/>
                <Rij label="ANW-hiaatverzekering" value={data.bestaandeAnwVerzekering?"Ja — aanwezig":"Nee — niet verzekerd"} kleur={!data.bestaandeAnwVerzekering&&data.burgelijkeStaat!=="alleenstaand"?T.warnText:T.text}/>
              </>}
              <Rij label="Kinderen" value={data.kinderen>0?`${data.kinderen} (leeftijden: ${data.kinderenLeeftijden?.join(", ")} jr)`:data.kinderen===0?"Geen":"Onbekend"}/>
            </div>
            <div>
              {anw.risico?(
                <div style={{background:T.dangerBg,border:`1px solid ${T.danger}44`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.dangerText,marginBottom:4,fontFamily:T.font}}>⚠ ANW-hiaat gesignaleerd</div>
                  <div style={{fontSize:11,color:T.dangerText,marginBottom:6,fontFamily:T.font}}>{anw.reden}</div>
                  <div style={{fontSize:16,fontWeight:700,color:T.dangerText,fontFamily:T.mono}}>~{eur(anw.hiaatMaand)}/mnd</div>
                  <div style={{fontSize:9,color:T.dangerText,fontFamily:T.font,marginBottom:6}}>potentieel gemiste ANW-uitkering bij overlijden</div>
                  <button style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${T.danger}`,background:T.dangerBg,color:T.dangerText,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
                    ANW-berekening opstarten
                  </button>
                </div>
              ):(
                <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.accent,fontFamily:T.font}}>✓ Geen ANW-hiaat risico</div>
                  <div style={{fontSize:11,color:T.accent,marginTop:4,fontFamily:T.font}}>{anw.reden}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTIE E — KEUZES EN BESLUITEN
// ══════════════════════════════════════════════════════════════════
function SectieE({wn}){
  const [keuzes,setKeuzes]=useState({
    lifecycle:wn.lifecycleKeuze,
    hoogLaag:wn.hoogLaag,
    hoogLaagVerhouding:wn.hoogLaagVerhouding||120,
    uitruilOpPp:wn.uitruilOpPp,
    uitruilPct:wn.uitruilBedrag||10,
    bedragIneens:wn.bedragIneens,
    bedragIneesPct:wn.bedragIneesPct||10,
  });
  const [opgeslagen,setOpgeslagen]=useState(false);

  const sla=()=>{setOpgeslagen(true);setTimeout(()=>setOpgeslagen(false),2500);};

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop icon="⚙️" sub="Keuzes vastgelegd per werknemer · wettelijk vereist voor dossier">Keuzes & Besluiten</Kop>
      <div style={{padding:"14px 16px"}}>

        {/* Lifecycle */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:8,fontFamily:T.font}}>Lifecycle-keuze</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["standaard","Standaard lifecycle"],["offensief","Offensief"],["defensief","Defensief"],["eigen","Eigen allocatie"]].map(([v,l])=>(
              <button key={v} onClick={()=>setKeuzes(k=>({...k,lifecycle:v}))}
                style={{padding:"6px 13px",borderRadius:7,border:`1px solid ${keuzes.lifecycle===v?T.accent:T.border}`,background:keuzes.lifecycle===v?T.accent:"transparent",color:keuzes.lifecycle===v?"#fff":T.textSec,fontSize:12,cursor:"pointer",fontFamily:T.font,fontWeight:keuzes.lifecycle===v?600:400}}>
                {l}
              </button>
            ))}
          </div>
          {keuzes.lifecycle!=="standaard"&&<div style={{marginTop:6,fontSize:11,color:T.blue,fontFamily:T.font}}>Eigen lifecycle-keuze vereist documentatie in het dossier en communicatie aan de uitvoerder.</div>}
        </div>

        {/* Hoog/laag */}
        <div style={{padding:"12px 14px",background:T.bgSec,borderRadius:10,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:keuzes.hoogLaag?10:0}}>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>Hoog/laag-constructie</div>
              <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>Eerste jaren hoger pensioen, daarna lager (of omgekeerd)</div>
            </div>
            <Toggle aan={keuzes.hoogLaag} onChange={v=>setKeuzes(k=>({...k,hoogLaag:v}))}/>
          </div>
          {keuzes.hoogLaag&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <span style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>Eerste 5 jaar</span>
              <span style={{fontSize:14,fontWeight:700,color:T.accent,fontFamily:T.mono}}>{keuzes.hoogLaagVerhouding}%</span>
            </div>
            <input type="range" min={110} max={150} step={5} value={keuzes.hoogLaagVerhouding} onChange={e=>setKeuzes(k=>({...k,hoogLaagVerhouding:+e.target.value}))} style={{width:"100%",accentColor:T.accent}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}>
              <span>Eerste 5 jr: {keuzes.hoogLaagVerhouding}% van normaal</span>
              <span>Daarna: {200-keuzes.hoogLaagVerhouding}%</span>
            </div>
          </div>}
        </div>

        {/* Uitruil OP/PP */}
        <div style={{padding:"12px 14px",background:T.bgSec,borderRadius:10,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:keuzes.uitruilOpPp?10:0}}>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>Uitruil ouderdomspensioen ↔ partnerpensioen</div>
              <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>OP verlagen in ruil voor hoger PP of vice versa</div>
            </div>
            <Toggle aan={keuzes.uitruilOpPp} onChange={v=>setKeuzes(k=>({...k,uitruilOpPp:v}))}/>
          </div>
          {keuzes.uitruilOpPp&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <span style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>Uitruil-percentage OP</span>
              <span style={{fontSize:14,fontWeight:700,color:T.purple,fontFamily:T.mono}}>{keuzes.uitruilPct}%</span>
            </div>
            <input type="range" min={5} max={30} step={5} value={keuzes.uitruilPct} onChange={e=>setKeuzes(k=>({...k,uitruilPct:+e.target.value}))} style={{width:"100%",accentColor:T.purple}}/>
          </div>}
        </div>

        {/* Bedrag ineens */}
        <div style={{padding:"12px 14px",background:T.bgSec,borderRadius:10,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:keuzes.bedragIneens?10:0}}>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>Bedrag ineens (10%-regeling)</div>
              <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>Maximaal 10% als eenmalig bedrag op pensioendatum</div>
            </div>
            <Toggle aan={keuzes.bedragIneens} onChange={v=>setKeuzes(k=>({...k,bedragIneens:v}))}/>
          </div>
          {keuzes.bedragIneens&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <span style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>Percentage</span>
              <span style={{fontSize:14,fontWeight:700,color:T.blue,fontFamily:T.mono}}>{keuzes.bedragIneesPct}%</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={keuzes.bedragIneesPct} onChange={e=>setKeuzes(k=>({...k,bedragIneesPct:+e.target.value}))} style={{width:"100%",accentColor:T.blue}}/>
            <div style={{marginTop:6,padding:"7px 10px",background:T.warnBg,borderRadius:7,fontSize:10,color:T.warnText,fontFamily:T.font}}>
              ⚠ Wetgeving bedrag ineens nog niet definitief vastgesteld. Leg vast als intentie — herstel als wet van kracht is.
            </div>
          </>}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:T.textTer,fontFamily:T.font}}>Keuzes vastleggen met tijdstempel in het dossier</span>
          <button onClick={sla} style={{padding:"8px 18px",borderRadius:8,border:"none",background:opgeslagen?T.accentBg:T.accent,color:opgeslagen?T.accent:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
            {opgeslagen?"✓ Opgeslagen":"Keuzes vastleggen"}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTIE F — COMMUNICATIE EN INSTEMMING
// ══════════════════════════════════════════════════════════════════
function SectieF({wn}){
  const stappen=[
    {label:"Portaaluitnodiging verstuurd",datum:wn.portaalUitnodigingDatum,klaar:!!wn.portaalUitnodigingDatum},
    {label:"Portaal geopend",             datum:wn.portaalGeopendDatum,     klaar:wn.portaalGeopend},
    {label:"Was-wordt brief gelezen",      datum:wn.wasWordtGelezenDatum,    klaar:wn.wasWordtGelezen},
    {label:"Ingestemd",                    datum:wn.instemmingDatum,         klaar:wn.instemming==="ingestemd"},
  ];

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop icon="✍️" sub="Communicatietraject en digitale instemming met audit-trail">Communicatie & Instemming</Kop>
      <div style={{padding:"14px 16px"}}>

        {/* Voortgangsbalk */}
        <div style={{display:"flex",gap:0,marginBottom:16}}>
          {stappen.map((s,i)=>(
            <div key={s.label} style={{flex:1,display:"flex",alignItems:"center"}}>
              <div style={{flex:1,textAlign:"center",paddingBottom:8,borderBottom:`3px solid ${s.klaar?T.accent:T.borderSec}`}}>
                <div style={{fontSize:18,marginBottom:3}}>{s.klaar?"✅":"⬜"}</div>
                <div style={{fontSize:10,fontWeight:s.klaar?600:400,color:s.klaar?T.accent:T.textTer,fontFamily:T.font,lineHeight:1.3}}>{s.label}</div>
                <div style={{fontSize:9,fontFamily:T.mono,color:T.textTer,marginTop:2}}>{s.datum?datNL(s.datum):"—"}</div>
              </div>
              {i<stappen.length-1&&<div style={{width:8,height:2,background:stappen[i+1].klaar?T.accent:T.borderSec,flexShrink:0}}/>}
            </div>
          ))}
        </div>

        {/* Instemmingsbewijs */}
        {wn.instemming==="ingestemd"&&(
          <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:6,fontFamily:T.font}}>✓ Digitale instemming vastgelegd</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              <Rij label="Datum instemming" value={datNL(wn.instemmingDatum)}/>
              <Rij label="IP-adres" value={wn.instemmingIp} mono/>
              <Rij label="Methode" value="Digitaal via werknemersportaal"/>
              <Rij label="Bewaarplicht" value="7 jaar (Wft art. 4:15)"/>
            </div>
          </div>
        )}

        {/* Vragen */}
        {wn.vragen.length>0&&(
          <div>
            <div style={{fontSize:11,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",marginBottom:8,fontFamily:T.font}}>Gestelde vragen via portaal</div>
            {wn.vragen.map((v,i)=>(
              <div key={i} style={{background:T.bgSec,borderRadius:9,padding:"10px 12px",marginBottom:8,border:`0.5px solid ${T.border}`}}>
                <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:4,fontFamily:T.font}}>❓ {v.vraag}</div>
                <div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginBottom:4}}>✓ {v.antwoord}</div>
                <div style={{fontSize:9,color:T.textTer,fontFamily:T.font}}>{datNL(v.datum)} · Beantwoord door {v.beantwoordDoor} op {datNL(v.antwoordDatum)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// SECTIE G — TRIGGERS EN SIGNALERING
// ══════════════════════════════════════════════════════════════════
function SectieG({wn}){
  const [triggers,setTriggers]=useState(wn.triggers);
  const handel=(id)=>setTriggers(p=>p.map(t=>t.type===id?{...t,afgehandeld:true}:t));

  const prioMeta={hoog:{k:T.dangerText,bg:T.dangerBg},middel:{k:T.warnText,bg:T.warnBg},laag:{k:T.textTer,bg:T.bgSec}};
  const typeIcon={pensioen_19jr:"⏰",pensioen_10jr:"⏰",pensioen_5jr:"🔔",anw_hiaat:"⚠️",slaper:"💤",cao_update:"📋",salaris_wijziging:"💰"};

  return(
    <Card style={{overflow:"hidden"}}>
      <Kop icon="🔔" sub="Automatische signalering — bewaking conform Wft zorgplicht">Triggers & Signalering</Kop>
      <div style={{padding:"14px 16px"}}>
        {triggers.map(t=>{
          const pm=prioMeta[t.prioriteit];
          return(
            <div key={t.type} style={{display:"flex",gap:12,padding:"10px 12px",background:t.afgehandeld?T.bgSec:pm.bg,border:`0.5px solid ${t.afgehandeld?T.borderSec:pm.k+"44"}`,borderRadius:9,marginBottom:8,opacity:t.afgehandeld?0.5:1}}>
              <span style={{fontSize:20,flexShrink:0}}>{typeIcon[t.type]||"🔔"}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:t.afgehandeld?T.textTer:T.text,fontFamily:T.font,marginBottom:2}}>{t.label}</div>
                <div style={{fontSize:10,color:T.textTer,fontFamily:T.mono}}>{datNL(t.datum)}</div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                {t.afgehandeld
                  ?<Pill label="Afgehandeld" kleur={T.textTer} bg={T.bgSec} small/>
                  :<><Pill label={t.prioriteit} kleur={pm.k} bg={pm.bg} small/>
                    <button onClick={()=>handel(t.type)} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgCard,fontSize:10,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>✓ Afhandelen</button>
                  </>}
              </div>
            </div>
          );
        })}

        <div style={{background:T.bgSec,border:`0.5px solid ${T.border}`,borderRadius:9,padding:"10px 12px",fontSize:11,color:T.textTer,fontFamily:T.font}}>
          Triggers worden automatisch gegenereerd op basis van leeftijd, burgerlijke staat en salariswijzigingen. Het systeem controleert dagelijks op nieuwe triggers.
        </div>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT — WERKNEMERSDOSSIER
// ══════════════════════════════════════════════════════════════════
const TABS=[
  {id:"overzicht",   label:"Overzicht"},
  {id:"opbouw",      label:"Pensioenopbouw"},
  {id:"vorige",      label:"Vorige regelingen"},
  {id:"situatie",    label:"Persoonlijke situatie"},
  {id:"keuzes",      label:"Keuzes"},
  {id:"communicatie",label:"Communicatie"},
  {id:"signalering", label:"Signalering"},
];

export default function WerknemersDossier(){
  const [tab,setTab]=useState("overzicht");

  const openTriggers=WN.triggers.filter(t=>!t.afgehandeld).length;
  const anw=anwHiaatAnalyse(WN);
  const slapers=WN.vorigeRegelingen.filter(r=>r.status==="slapend").length;

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:T.font}}>

      {/* Sticky header */}
      <div style={{background:T.bgCard,borderBottom:`0.5px solid ${T.border}`,position:"sticky",top:0,zIndex:100}}>

        {/* Breadcrumb */}
        <div style={{padding:"10px 24px 0",display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.textTer}}>
          <span style={{color:T.accent,cursor:"pointer",fontWeight:500}}>← Alle klanten</span>
          <span>/</span>
          <span style={{color:T.textSec,cursor:"pointer"}}>Oranje Techniek B.V.</span>
          <span>/</span>
          <span style={{color:T.textSec,cursor:"pointer"}}>Werknemers</span>
          <span>/</span>
          <span style={{color:T.text,fontWeight:600}}>{WN.naam}</span>
        </div>

        {/* Werknemer header */}
        <div style={{padding:"10px 24px 12px",display:"flex",alignItems:"center",gap:16,justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:11,background:T.accentBg,border:`1px solid ${T.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:T.accent,flexShrink:0}}>
              {WN.naam.split(" ").map(w=>w[0]).slice(0,2).join("")}
            </div>
            <div>
              <div style={{fontSize:17,fontWeight:700,color:T.text,marginBottom:2}}>{WN.naam}</div>
              <div style={{fontSize:11,color:T.textTer,display:"flex",gap:10,flexWrap:"wrap"}}>
                <span>{WN.functie}</span>
                <span>·</span>
                <span>{WN.leeftijd} jaar</span>
                <span>·</span>
                <span>In dienst: {datNL(WN.inDienstDatum)}</span>
                <span>·</span>
                <span style={{fontFamily:T.mono}}>{WN.email}</span>
              </div>
            </div>
          </div>

          {/* Status chips */}
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {[
              [WN.instemming==="ingestemd"?"✓ Ingestemd":"Niet ingestemd", WN.instemming==="ingestemd"?T.accent:T.warnText, WN.instemming==="ingestemd"?T.accentBg:T.warnBg],
              [anw.risico?"⚠ ANW-hiaat":"✓ Geen ANW-risico", anw.risico?T.dangerText:T.accent, anw.risico?T.dangerBg:T.accentBg],
              [slapers>0?`${slapers} slaper(s)`:"Geen slapers", slapers>0?T.warnText:T.textTer, slapers>0?T.warnBg:T.bgSec],
              [openTriggers>0?`${openTriggers} trigger(s)`:"Geen triggers", openTriggers>0?T.warnText:T.textTer, openTriggers>0?T.warnBg:T.bgSec],
            ].map(([l,k,bg])=>(
              <span key={l} style={{fontSize:10,fontWeight:600,color:k,background:bg,padding:"4px 10px",borderRadius:99,fontFamily:T.font}}>{l}</span>
            ))}
          </div>
        </div>

        {/* Subnavigatie */}
        <div style={{display:"flex",gap:0,padding:"0 24px"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:"9px 14px",border:"none",borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",background:"transparent",fontSize:12,fontWeight:tab===t.id?600:400,color:tab===t.id?T.accent:T.textSec,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:14}}>

        {tab==="overzicht"&&<>
          {/* Mini samenvatting */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              [eur(WN.salaris),"Bruto jaarsalaris",T.text],
              [eurC(WN.opgebouwdKapitaal),"Opgebouwd kapitaal",T.accent],
              [eur(WN.aow+WN.urm.p50)+"/mnd","Verwacht pensioen (P50)",T.warn],
              [eurC(WN.vorigeRegelingen.reduce((s,r)=>s+r.waarde,0)),"Elders opgebouwd",WN.vorigeRegelingen.some(r=>r.status==="slapend")?T.warnText:T.textSec],
            ].map(([v,l,k])=>(
              <div key={l} style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"11px 13px"}}>
                <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".04em",marginBottom:3,fontFamily:T.font}}>{l}</div>
                <div style={{fontSize:16,fontWeight:700,color:k,fontFamily:T.mono}}>{v}</div>
              </div>
            ))}
          </div>

          <SectieA wn={WN}/>
          <SectieG wn={WN}/>
        </>}

        {tab==="opbouw"    && <SectieB wn={WN}/>}
        {tab==="vorige"    && <SectieC wn={WN}/>}
        {tab==="situatie"  && <SectieD wn={WN}/>}
        {tab==="keuzes"    && <SectieE wn={WN}/>}
        {tab==="communicatie" && <SectieF wn={WN}/>}
        {tab==="signalering"  && <SectieG wn={WN}/>}
      </div>
    </div>
  );
}
