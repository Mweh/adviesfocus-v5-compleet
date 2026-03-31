import { useState, useMemo, useRef } from "react";

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
// HELPERS
// ══════════════════════════════════════════════════════════════════
const eur = n => new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n??0);
const eurC = n => {const v=n??0;if(v>=1e6)return`€\u00a0${(v/1e6).toFixed(2).replace(".",",")}\u00a0mln`;if(v>=1e3)return`€\u00a0${(v/1e3).toFixed(0)}\u00a0k`;return eur(v);};
const pct  = n => `${n}%`;
const datNL= s => s?new Date(s).toLocaleDateString("nl-NL",{day:"2-digit",month:"short",year:"numeric"}):"—";
const dagsDiff = (d) => Math.ceil((new Date(d)-new Date())/(1000*86400));

function Pill({label,kleur,bg,small=false}){
  return<span style={{fontSize:small?9:10,fontWeight:600,color:kleur,background:bg,padding:small?"1px 6px":"2px 8px",borderRadius:99,fontFamily:T.font,textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{label}</span>;
}
function Card({children,style={}}){
  return<div style={{background:T.bgCard,border:`0.5px solid ${T.border}`,borderRadius:12,...style}}>{children}</div>;
}
function Kop({icon,children,sub,actie}){
  return<div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.borderSec}`,background:T.bgSec,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {icon&&<span style={{fontSize:16}}>{icon}</span>}
      <div>
        <div style={{fontSize:13,fontWeight:600,color:T.text,fontFamily:T.font}}>{children}</div>
        {sub&&<div style={{fontSize:11,color:T.textSec,marginTop:1,fontFamily:T.font}}>{sub}</div>}
      </div>
    </div>
    {actie}
  </div>;
}
function SaveBtn({label="Opslaan",saved="✓ Opgeslagen",onSave,style={}}){
  const [st,setSt]=useState("idle");
  return<button onClick={()=>{setSt("saving");setTimeout(()=>{setSt("saved");if(onSave)onSave();setTimeout(()=>setSt("idle"),2500);},700);}} disabled={st!=="idle"}
    style={{padding:"8px 18px",borderRadius:8,border:"none",background:st==="saved"?T.accentBg:T.accent,color:st==="saved"?T.accent:"#fff",fontSize:13,fontWeight:600,cursor:st!=="idle"?"not-allowed":"pointer",fontFamily:T.font,opacity:st==="saving"?.6:1,...style}}>
    {st==="saving"?"Opslaan…":st==="saved"?saved:label}
  </button>;
}

// ══════════════════════════════════════════════════════════════════
// MODULE 1 — MIJNPENSIOENOVERZICHT XML IMPORT
// ══════════════════════════════════════════════════════════════════

// Gesimuleerde XML-parse (in productie: echte DOMParser op mpo.nl XML)
const MOCK_MPO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<PensioenOverzicht xmlns="urn:mpo:v4">
  <Persoon>
    <Naam>H. van Dijk</Naam>
    <BSNHash>a3f9...</BSNHash>
    <Geboortedatum>1978-03-15</Geboortedatum>
    <AOWLeeftijd>67</AOWLeeftijd>
  </Persoon>
  <PensioenAanspraken>
    <Aanspraak>
      <Uitvoerder>Zwitserleven</Uitvoerder>
      <Regelnummer>SL-2003-44821</Regelnummer>
      <Type>OuderdomsPensioen</Type>
      <PeriodeVan>2003-01-01</PeriodeVan>
      <PeriodeTot>2005-06-30</PeriodeTot>
      <BedragBrutoJaar>2460</BedragBrutoJaar>
      <ScenarioPessimistisch>1840</ScenarioPessimistisch>
      <ScenarioVerwacht>2460</ScenarioVerwacht>
      <ScenarioOptimistisch>3280</ScenarioOptimistisch>
      <Status>Slapend</Status>
    </Aanspraak>
    <Aanspraak>
      <Uitvoerder>Nationale-Nederlanden</Uitvoerder>
      <Regelnummer>NN-2005-91023</Regelnummer>
      <Type>OuderdomsPensioen</Type>
      <PeriodeVan>2005-07-01</PeriodeVan>
      <PeriodeTot>2010-02-28</PeriodeTot>
      <BedragBrutoJaar>4920</BedragBrutoJaar>
      <ScenarioPessimistisch>3690</ScenarioPessimistisch>
      <ScenarioVerwacht>4920</ScenarioVerwacht>
      <ScenarioOptimistisch>6560</ScenarioOptimistisch>
      <Status>Overgedragen</Status>
    </Aanspraak>
    <Aanspraak>
      <Uitvoerder>ASR Nederland N.V.</Uitvoerder>
      <Regelnummer>ASR-2010-VD-44821</Regelnummer>
      <Type>OuderdomsPensioen</Type>
      <PeriodeVan>2010-03-01</PeriodeVan>
      <PeriodeTot></PeriodeTot>
      <BedragBrutoJaar>18400</BedragBrutoJaar>
      <ScenarioPessimistisch>13800</ScenarioPessimistisch>
      <ScenarioVerwacht>18400</ScenarioVerwacht>
      <ScenarioOptimistisch>24500</ScenarioOptimistisch>
      <Status>Actief</Status>
    </Aanspraak>
  </PensioenAanspraken>
  <AOW>
    <BedragBrutoJaar>16800</BedragBrutoJaar>
    <BedragBrutoMaand>1400</BedragBrutoMaand>
  </AOW>
</PensioenOverzicht>`;

function parseMPOXML(xmlStr) {
  // Simuleer DOM parse — in productie: DOMParser().parseFromString(xmlStr, "text/xml")
  return {
    persoon:{ naam:"H. van Dijk", geboortedatum:"1978-03-15", aowLeeftijd:67 },
    aow:{ brutoJaar:16800, brutoMaand:1400 },
    aanspraken:[
      { uitvoerder:"Zwitserleven", regelnummer:"SL-2003-44821", type:"OuderdomsPensioen",
        periode:"2003–2005", bedragJaar:2460, p5:1840, p50:2460, p95:3280, status:"Slapend" },
      { uitvoerder:"Nationale-Nederlanden", regelnummer:"NN-2005-91023", type:"OuderdomsPensioen",
        periode:"2005–2010", bedragJaar:4920, p5:3690, p50:4920, p95:6560, status:"Overgedragen" },
      { uitvoerder:"ASR Nederland N.V.", regelnummer:"ASR-2010-VD-44821", type:"OuderdomsPensioen",
        periode:"2010–heden", bedragJaar:18400, p5:13800, p50:18400, p95:24500, status:"Actief" },
    ],
  };
}

function ModuleMPO() {
  const [fase, setFase]         = useState("upload"); // upload | preview | klaar
  const [dragOver, setDragOver] = useState(false);
  const [bestand, setBestand]   = useState(null);
  const [data, setData]         = useState(null);
  const [geimporteerd, setGeimporteerd] = useState([]);
  const fileRef = useRef(null);

  function verwerkXML(file) {
    setBestand(file);
    // In productie: file.text().then(xml => parseMPOXML(xml))
    setTimeout(() => {
      setData(parseMPOXML(MOCK_MPO_XML));
      setFase("preview");
    }, 600);
  }

  const slapers = data?.aanspraken.filter(a => a.status === "Slapend") || [];
  const totaalP50 = data?.aanspraken.reduce((s,a) => s + a.p50, 0) || 0;

  const statusMeta = {
    Actief:       { k:T.accent,     bg:T.accentBg  },
    Slapend:      { k:T.warnText,   bg:T.warnBg    },
    Overgedragen: { k:T.textTer,    bg:T.bgSec     },
  };

  return (
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>MijnPensioenoverzicht.nl Import</h2>
        <p style={{margin:0,fontSize:13,color:T.textSec}}>Importeer elders opgebouwde pensioenaanspraken rechtstreeks vanuit mijnpensioenoverzicht.nl — slapers worden automatisch herkend.</p>
      </div>

      {/* Instructie */}
      <Card style={{padding:"14px 16px",marginBottom:16,background:T.blueBg,border:`0.5px solid ${T.blue}44`}}>
        <div style={{fontSize:12,fontWeight:600,color:T.blue,marginBottom:8,fontFamily:T.font}}>📋 Hoe het XML-bestand te downloaden</div>
        {[
          "Ga naar mijnpensioenoverzicht.nl en log in met DigiD",
          "Klik op 'Exporteer mijn pensioengegevens' → kies XML-formaat",
          "Sla het bestand op en upload het hieronder",
          "AdviesFocus importeert alle aanspraken automatisch in het werknemersdossier",
        ].map((s,i) => (
          <div key={i} style={{display:"flex",gap:8,padding:"3px 0",fontSize:12,color:T.blue,fontFamily:T.font}}>
            <span style={{fontWeight:700,width:16,flexShrink:0}}>{i+1}.</span><span>{s}</span>
          </div>
        ))}
        <div style={{marginTop:8,fontSize:11,color:T.blue,fontFamily:T.font,opacity:.7}}>
          Privacy: het XML-bestand verlaat uw browser niet vóór upload. De BSN-hash wordt nooit opgeslagen.
        </div>
      </Card>

      {fase === "upload" && (
        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);verwerkXML(e.dataTransfer.files[0]);}}
          onClick={()=>fileRef.current?.click()}
          style={{border:`2px dashed ${dragOver?T.accent:T.border}`,borderRadius:12,padding:"36px 24px",textAlign:"center",cursor:"pointer",background:dragOver?T.accentBg:T.bgSec,transition:"all .15s"}}>
          <input ref={fileRef} type="file" accept=".xml" style={{display:"none"}} onChange={e=>verwerkXML(e.target.files[0])}/>
          <div style={{fontSize:32,marginBottom:10}}>📄</div>
          <div style={{fontSize:14,fontWeight:600,color:T.text,fontFamily:T.font}}>Sleep het MPO XML-bestand hierheen</div>
          <div style={{fontSize:12,color:T.textSec,fontFamily:T.font,marginTop:4}}>of klik om te bladeren · .xml</div>
        </div>
      )}

      {fase === "preview" && data && (
        <div>
          {/* Samenvatting */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
            {[
              [`${data.aanspraken.length}`,  "Aanspraken gevonden",   T.text,    T.bgCard],
              [`${slapers.length}`,           "Slapers",              slapers.length>0?T.warnText:T.accent, slapers.length>0?T.warnBg:T.accentBg],
              [eur(totaalP50/12)+"/mnd",     "Totaal P50/mnd",       T.accent,  T.accentBg],
            ].map(([v,l,k,bg]) => (
              <div key={l} style={{background:bg,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"11px 13px"}}>
                <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".04em",marginBottom:2,fontFamily:T.font}}>{l}</div>
                <div style={{fontSize:18,fontWeight:700,color:k,fontFamily:T.mono}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Aanspraken tabel */}
          <Card style={{overflow:"hidden",marginBottom:14}}>
            <Kop icon="📊" sub={`${data.persoon.naam} · geb. ${data.persoon.geboortedatum}`}>Gevonden aanspraken</Kop>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:T.bgSec}}>
                {["Uitvoerder","Periode","Status","P5/mnd","P50/mnd","P95/mnd","Importeren"].map(h=>(
                  <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {data.aanspraken.map((a,i)=>{
                  const sm = statusMeta[a.status] || statusMeta.Slapend;
                  const alGedaan = geimporteerd.includes(a.regelnummer);
                  return (
                    <tr key={a.regelnummer} style={{background:i%2===0?T.bgCard:T.bgSec}}>
                      <td style={{padding:"9px 12px"}}>
                        <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{a.uitvoerder}</div>
                        <div style={{fontSize:10,color:T.textTer,fontFamily:T.mono}}>{a.regelnummer}</div>
                      </td>
                      <td style={{padding:"9px 12px",fontSize:11,color:T.textSec,fontFamily:T.font}}>{a.periode}</td>
                      <td style={{padding:"9px 12px"}}><Pill label={a.status} kleur={sm.k} bg={sm.bg} small/></td>
                      <td style={{padding:"9px 12px",fontSize:12,fontFamily:T.mono,color:T.dangerText}}>{eur(a.p5/12)}</td>
                      <td style={{padding:"9px 12px",fontSize:12,fontFamily:T.mono,color:T.warn,fontWeight:600}}>{eur(a.p50/12)}</td>
                      <td style={{padding:"9px 12px",fontSize:12,fontFamily:T.mono,color:T.accent}}>{eur(a.p95/12)}</td>
                      <td style={{padding:"9px 12px"}}>
                        {alGedaan
                          ?<span style={{fontSize:11,color:T.accent,fontFamily:T.font}}>✓ Geïmporteerd</span>
                          :<button onClick={()=>setGeimporteerd(p=>[...p,a.regelnummer])}
                            style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${a.status==="Slapend"?T.warn:T.border}`,background:a.status==="Slapend"?T.warnBg:T.bgSec,color:a.status==="Slapend"?T.warnText:T.textSec,fontSize:11,fontWeight:a.status==="Slapend"?600:400,cursor:"pointer",fontFamily:T.font}}>
                            {a.status==="Slapend"?"🔔 Importeer + WO":"Importeren"}
                          </button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Slaper waarschuwing */}
          {slapers.length > 0 && (
            <Card style={{padding:"14px 16px",marginBottom:14,border:`1px solid ${T.warn}44`,background:T.warnBg}}>
              <div style={{fontSize:13,fontWeight:700,color:T.warnText,marginBottom:6,fontFamily:T.font}}>
                ⚠ {slapers.length} slaper{slapers.length>1?"s":""} gevonden — waardeoverdracht aanbevolen
              </div>
              {slapers.map(s=>(
                <div key={s.regelnummer} style={{fontSize:12,color:T.warnText,fontFamily:T.font,marginBottom:2}}>
                  • {s.uitvoerder} · periode {s.periode} · P50: {eur(s.p50/12)}/mnd
                </div>
              ))}
              <div style={{marginTop:8,fontSize:11,color:T.warnText,fontFamily:T.font}}>
                Door "Importeer + WO" te klikken wordt een waardeoverdrachtsverzoek als taak aangemaakt in het dossier en ontvangt de adviseur een herinnering.
              </div>
            </Card>
          )}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={()=>{setFase("upload");setData(null);setGeimporteerd([]);}} style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:12,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>
              ← Ander bestand
            </button>
            {geimporteerd.length>0&&<div style={{fontSize:12,color:T.accent,fontFamily:T.font}}>✓ {geimporteerd.length} aanspraak{geimporteerd.length>1?"en":""} toegevoegd aan dossier</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 2 — WTP-DEADLINE TRACKER
// ══════════════════════════════════════════════════════════════════

const KLANTEN_DEADLINES = [
  { id:"k1", naam:"Oranje Techniek B.V.",       adviseur:"D. Wietzema Menkhorst", invaardatum:"2026-07-01",
    mijlpalen:[
      { label:"OR-instemmingsverzoek",       deadline:"2026-03-01", klaar:true,  wettelijk:"WOR art. 27" },
      { label:"Werknemer-instemming ronde",   deadline:"2026-04-15", klaar:false, wettelijk:"Pw art. 48a" },
      { label:"Offertevergelijking definitief",deadline:"2026-04-01", klaar:true,  wettelijk:"Bgfo art. 80a" },
      { label:"Nieuwe regeling ondertekend", deadline:"2026-05-01", klaar:false, wettelijk:"Pw" },
      { label:"Implementatie bij uitvoerder", deadline:"2026-06-01", klaar:false, wettelijk:"Wtp" },
      { label:"Invaardatum",                  deadline:"2026-07-01", klaar:false, wettelijk:"Wtp art. 150l" },
    ]},
  { id:"k2", naam:"Bouwgroep De Vries",          adviseur:"S. van der Berg",       invaardatum:"2027-01-01",
    mijlpalen:[
      { label:"Inventarisatie afronden",      deadline:"2026-06-01", klaar:false, wettelijk:"Wft 4:23" },
      { label:"OR-instemmingsverzoek",        deadline:"2026-09-01", klaar:false, wettelijk:"WOR art. 27" },
      { label:"Werknemer-instemming ronde",   deadline:"2026-11-01", klaar:false, wettelijk:"Pw art. 48a" },
      { label:"Invaardatum",                  deadline:"2027-01-01", klaar:false, wettelijk:"Wtp art. 150l" },
    ]},
  { id:"k3", naam:"Zorginstelling Oosterpoort", adviseur:"D. Wietzema Menkhorst", invaardatum:"2026-10-01",
    mijlpalen:[
      { label:"OR-instemmingsverzoek",        deadline:"2026-05-01", klaar:false, wettelijk:"WOR art. 27" },
      { label:"Werknemer-instemming ronde",   deadline:"2026-07-01", klaar:false, wettelijk:"Pw art. 48a" },
      { label:"Invaardatum",                  deadline:"2026-10-01", klaar:false, wettelijk:"Wtp art. 150l" },
    ]},
];

function ModuleDeadlineTracker() {
  const [geselecteerd, setGeselecteerd] = useState("k1");
  const klant = KLANTEN_DEADLINES.find(k => k.id === geselecteerd);

  const urgentie = (deadline) => {
    const d = dagsDiff(deadline);
    if (d < 0)  return { kleur:T.dangerText, bg:T.dangerBg, label:"Verstreken" };
    if (d < 14) return { kleur:T.dangerText, bg:T.dangerBg, label:`${d} dagen` };
    if (d < 45) return { kleur:T.warnText,   bg:T.warnBg,   label:`${d} dagen` };
    return             { kleur:T.textTer,    bg:T.bgSec,    label:`${d} dagen` };
  };

  const volgende = klant.mijlpalen.find(m => !m.klaar);
  const dagenInvaar = dagsDiff(klant.invaardatum);

  return (
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Wtp-Deadline Tracker</h2>
        <p style={{margin:0,fontSize:13,color:T.textSec}}>Bewaking van alle wettelijke deadlines per klant — automatische signalering bij overschrijding.</p>
      </div>

      {/* Klantselector */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {KLANTEN_DEADLINES.map(k => {
          const d = dagsDiff(k.invaardatum);
          const dringend = k.mijlpalen.some(m => !m.klaar && dagsDiff(m.deadline) < 30);
          return (
            <button key={k.id} onClick={()=>setGeselecteerd(k.id)}
              style={{padding:"9px 14px",borderRadius:9,border:`1px solid ${geselecteerd===k.id?T.accent:T.border}`,background:geselecteerd===k.id?T.accentBg:T.bgCard,cursor:"pointer",fontFamily:T.font,textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,fontWeight:600,color:geselecteerd===k.id?T.accent:T.text}}>{k.naam}</span>
                {dringend&&<span style={{width:7,height:7,borderRadius:"50%",background:T.danger,flexShrink:0}}/>}
              </div>
              <div style={{fontSize:10,color:T.textTer,marginTop:2,fontFamily:T.font}}>Invaar: {datNL(k.invaardatum)} · {d} dagen</div>
            </button>
          );
        })}
      </div>

      {klant && (
        <>
          {/* Countdown header */}
          <Card style={{padding:"16px",marginBottom:14,background:dagenInvaar<90?T.warnBg:T.accentBg,border:`1px solid ${dagenInvaar<90?T.warn:T.accent}44`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:dagenInvaar<90?T.warnText:T.accent,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font}}>Invaardatum</div>
                <div style={{fontSize:26,fontWeight:700,color:dagenInvaar<90?T.warnText:T.accent,fontFamily:T.mono,lineHeight:1.1}}>{dagenInvaar} dagen</div>
                <div style={{fontSize:12,color:dagenInvaar<90?T.warnText:T.accent,fontFamily:T.font}}>{datNL(klant.invaardatum)}</div>
              </div>
              {volgende && (
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:dagenInvaar<90?T.warnText:T.accent,fontFamily:T.font,marginBottom:3}}>Eerstvolgende deadline</div>
                  <div style={{fontSize:14,fontWeight:700,color:dagenInvaar<90?T.warnText:T.accent,fontFamily:T.font}}>{volgende.label}</div>
                  <div style={{fontSize:12,color:dagenInvaar<90?T.warnText:T.accent,fontFamily:T.mono}}>{datNL(volgende.deadline)} · {dagsDiff(volgende.deadline)} dagen</div>
                </div>
              )}
            </div>
            {/* Voortgangsbalk */}
            <div style={{marginTop:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:dagenInvaar<90?T.warnText:T.accent,marginBottom:4,fontFamily:T.font}}>
                <span>{klant.mijlpalen.filter(m=>m.klaar).length} van {klant.mijlpalen.length} mijlpalen voltooid</span>
                <span>{Math.round(klant.mijlpalen.filter(m=>m.klaar).length/klant.mijlpalen.length*100)}%</span>
              </div>
              <div style={{height:8,background:"rgba(0,0,0,.1)",borderRadius:99,overflow:"hidden"}}>
                <div style={{width:`${klant.mijlpalen.filter(m=>m.klaar).length/klant.mijlpalen.length*100}%`,height:"100%",background:dagenInvaar<90?T.warn:T.accent,borderRadius:99,transition:"width .4s"}}/>
              </div>
            </div>
          </Card>

          {/* Mijlpalen tijdlijn */}
          <Card style={{overflow:"hidden"}}>
            <Kop icon="📅" sub={`${klant.naam} · adviseur: ${klant.adviseur}`}>Mijlpalen tijdlijn</Kop>
            <div style={{padding:"14px 16px"}}>
              {klant.mijlpalen.map((m,i)=>{
                const urg = urgentie(m.deadline);
                return (
                  <div key={i} style={{display:"flex",gap:14,paddingBottom:16,position:"relative"}}>
                    {/* Lijn */}
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,width:20}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:m.klaar?T.accent:urg.bg,border:`2px solid ${m.klaar?T.accent:urg.kleur}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:m.klaar?"#fff":urg.kleur,fontWeight:700,flexShrink:0}}>
                        {m.klaar?"✓":i+1}
                      </div>
                      {i<klant.mijlpalen.length-1&&<div style={{width:2,flex:1,background:m.klaar?T.accent:T.borderSec,marginTop:4,minHeight:20}}/>}
                    </div>
                    {/* Content */}
                    <div style={{flex:1,paddingTop:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:m.klaar?400:600,color:m.klaar?T.textTer:T.text,fontFamily:T.font,textDecoration:m.klaar?"line-through":"none"}}>{m.label}</span>
                        {!m.klaar&&<Pill label={urg.label} kleur={urg.kleur} bg={urg.bg} small/>}
                        {m.klaar&&<Pill label="Voltooid" kleur={T.accent} bg={T.accentBg} small/>}
                      </div>
                      <div style={{display:"flex",gap:12,fontSize:10,color:T.textTer,fontFamily:T.font}}>
                        <span>📅 {datNL(m.deadline)}</span>
                        <span>⚖ {m.wettelijk}</span>
                      </div>
                    </div>
                    {!m.klaar&&(
                      <button style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:11,cursor:"pointer",fontFamily:T.font,color:T.textSec,flexShrink:0,alignSelf:"flex-start"}}>
                        ✓ Markeer klaar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 3 — OR-INSTEMMINGSMODULE
// ══════════════════════════════════════════════════════════════════

const OR_LEDEN_MOCK = [
  { id:"or1", naam:"M. Visser",     functie:"OR-voorzitter",  email:"m.visser@oranjetechniek.nl",    stem:null,    datum:null },
  { id:"or2", naam:"A. de Vries",   functie:"OR-secretaris",  email:"a.devries@oranjetechniek.nl",   stem:"voor",  datum:"2026-03-22" },
  { id:"or3", naam:"K. Hendriks",   functie:"OR-lid",         email:"k.hendriks@oranjetechniek.nl",  stem:"voor",  datum:"2026-03-23" },
  { id:"or4", naam:"P. Koster",     functie:"OR-lid",         email:"p.koster@oranjetechniek.nl",    stem:null,    datum:null },
  { id:"or5", naam:"T. van Bergen", functie:"OR-lid",         email:"t.vanbergen@oranjetechniek.nl", stem:"tegen", datum:"2026-03-24" },
];

function ModuleOR() {
  const [leden, setLeden]         = useState(OR_LEDEN_MOCK);
  const [fase, setFase]           = useState("lopend"); // lopend | besloten | gearchiveerd
  const [besluit, setBesluit]     = useState(null);
  const [motivatie, setMotivatie] = useState("");
  const [herinnering, setHerinnering] = useState(null);

  const voor   = leden.filter(l => l.stem === "voor").length;
  const tegen  = leden.filter(l => l.stem === "tegen").length;
  const open   = leden.filter(l => !l.stem).length;
  const totaal = leden.length;
  const meerderheid = voor > totaal / 2;

  const registreerStem = (id, stem) => {
    setLeden(p => p.map(l => l.id===id ? {...l, stem, datum:new Date().toISOString().slice(0,10)} : l));
  };

  const stuurHerinnering = (id) => {
    setHerinnering(id);
    setTimeout(() => setHerinnering(null), 2500);
  };

  const sluitBesluit = (uitkomst) => {
    setBesluit({ uitkomst, datum:new Date().toISOString().slice(0,10), voor, tegen, onthouding:open });
    setFase("besloten");
  };

  return (
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>OR-Instemmingsmodule</h2>
        <p style={{margin:0,fontSize:13,color:T.textSec}}>Formele OR-instemmingsprocedure conform WOR art. 27 — stemregistratie, herinneringen en groepsbesluit vastleggen.</p>
      </div>

      {/* Status banner */}
      {fase === "besloten" && besluit && (
        <div style={{background:besluit.uitkomst==="ingestemd"?T.accentBg:T.dangerBg,border:`1px solid ${besluit.uitkomst==="ingestemd"?T.accent:T.danger}44`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:besluit.uitkomst==="ingestemd"?T.accent:T.dangerText,marginBottom:4,fontFamily:T.font}}>
            {besluit.uitkomst==="ingestemd"?"✓ OR heeft ingestemd":"✗ OR heeft niet ingestemd"}
          </div>
          <div style={{fontSize:12,color:besluit.uitkomst==="ingestemd"?T.accent:T.dangerText,fontFamily:T.font}}>
            {datNL(besluit.datum)} · Voor: {besluit.voor} · Tegen: {besluit.tegen} · Onthouding: {besluit.onthouding}
          </div>
          {motivatie&&<div style={{fontSize:12,color:besluit.uitkomst==="ingestemd"?T.accent:T.dangerText,marginTop:6,fontFamily:T.font,fontStyle:"italic"}}>"{motivatie}"</div>}
        </div>
      )}

      {/* Wettelijke context */}
      <Card style={{padding:"12px 14px",marginBottom:14,background:T.bgSec}}>
        <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:4,fontFamily:T.font}}>⚖ WOR art. 27 — instemmingsrecht bij pensioenwijziging</div>
        <div style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>De werkgever heeft instemming van de OR nodig bij wijziging van de pensioenregeling (arbeidsvoorwaarde). Zonder OR-instemming is de pensioenwijziging nietig. De OR heeft 30 dagen bedenktijd na ontvangst van het verzoek.</div>
      </Card>

      {/* Stemoverzicht KPI */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[
          [`${voor}`,   "Voor",          T.accent,     T.accentBg],
          [`${tegen}`,  "Tegen",         T.dangerText, T.dangerBg],
          [`${open}`,   "Nog te stemmen",open>0?T.warnText:T.textTer, open>0?T.warnBg:T.bgSec],
          [meerderheid?"Meerderheid":"Geen meerderheid","Status",meerderheid?T.accent:T.dangerText,meerderheid?T.accentBg:T.dangerBg],
        ].map(([v,l,k,bg])=>(
          <div key={l} style={{background:bg,border:`0.5px solid ${T.border}`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".04em",marginBottom:3,fontFamily:T.font}}>{l}</div>
            <div style={{fontSize:18,fontWeight:700,color:k,fontFamily:T.mono}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Stemregistratie */}
      {herinnering && (
        <div style={{background:T.accentBg,border:`0.5px solid ${T.accent}44`,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:11,color:T.accent,fontFamily:T.font}}>
          ✓ Herinnering verstuurd naar {leden.find(l=>l.id===herinnering)?.naam}
        </div>
      )}

      <Card style={{overflow:"hidden",marginBottom:14}}>
        <Kop icon="🗳" sub="Oranje Techniek B.V. · 5 OR-leden">Stemregistratie</Kop>
        {leden.map((l,i)=>(
          <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:i<leden.length-1?`0.5px solid ${T.borderSec}`:"none"}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:T.bgSec,border:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.text,flexShrink:0}}>
              {l.naam.split(" ").map(w=>w[0]).slice(0,2).join("")}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:T.font}}>{l.naam} <span style={{fontWeight:400,color:T.textTer}}>· {l.functie}</span></div>
              <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>{l.email}{l.datum&&` · gestemd ${datNL(l.datum)}`}</div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {l.stem
                ? <Pill label={l.stem==="voor"?"✓ Voor":"✗ Tegen"} kleur={l.stem==="voor"?T.accent:T.dangerText} bg={l.stem==="voor"?T.accentBg:T.dangerBg} small/>
                : fase==="lopend" && <>
                    <button onClick={()=>registreerStem(l.id,"voor")} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.accent}`,background:T.accentBg,color:T.accent,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Voor</button>
                    <button onClick={()=>registreerStem(l.id,"tegen")} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${T.danger}`,background:T.dangerBg,color:T.dangerText,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>Tegen</button>
                    <button onClick={()=>stuurHerinnering(l.id)} style={{padding:"4px 9px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bgSec,fontSize:10,cursor:"pointer",fontFamily:T.font,color:T.textSec}}>↺</button>
                  </>}
            </div>
          </div>
        ))}
      </Card>

      {/* Besluit sluiten */}
      {fase === "lopend" && (
        <Card style={{padding:"16px"}}>
          <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:10,fontFamily:T.font}}>Groepsbesluit vastleggen</div>
          <textarea value={motivatie} onChange={e=>setMotivatie(e.target.value)} placeholder="Optioneel: motivering of opmerkingen bij het besluit…" rows={2}
            style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>sluitBesluit("ingestemd")} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
              ✓ OR heeft ingestemd ({voor}/{totaal})
            </button>
            <button onClick={()=>sluitBesluit("niet_ingestemd")} style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${T.danger}`,background:T.dangerBg,color:T.dangerText,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
              ✗ OR heeft niet ingestemd ({tegen}/{totaal})
            </button>
          </div>
          <div style={{marginTop:8,fontSize:11,color:T.textTer,fontFamily:T.font}}>
            Besluit wordt vastgelegd met datum, steminformatie en IP-adres conform WOR art. 27. Bewaarplicht: 7 jaar.
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 4 — BEDRAG INEENS / TOESLAGEN IMPACT CALCULATOR
// ══════════════════════════════════════════════════════════════════

function ModuleBedragIneens() {
  const [salaris,       setSalaris]       = useState(62000);
  const [pensioenKap,   setPensioenKap]   = useState(280000);
  const [pct_ineens,    setPctIneens]     = useState(10);
  const [huishouding,   setHuishouding]   = useState("alleenstaand");
  const [huurder,       setHuurder]       = useState(true);
  const [zorgtoeslag,   setZorgtoeslag]   = useState(true);

  // Berekeningen
  const bedragIneens    = Math.round(pensioenKap * pct_ineens / 100);
  const restKapitaal    = pensioenKap - bedragIneens;
  // Maandelijkse uitkering: annuïteit 20 jaar @ 2%
  const r=0.02/12, n=240;
  const maandZonder = Math.round(pensioenKap  * (r*(1+r)**n)/((1+r)**n-1));
  const maandMet    = Math.round(restKapitaal * (r*(1+r)**n)/((1+r)**n-1));
  const maandVerlies= maandZonder - maandMet;

  // AOW (2026)
  const aow = huishouding==="alleenstaand" ? 1400 : 960;
  const totaalInkomenZonder = aow + maandZonder;
  const totaalInkomenMet    = aow + maandMet;

  // Toeslagen (vereenvoudigd 2026)
  // Zorgtoeslag: max €154/mnd bij inkomen < €38.520 (alleenstaand)
  const zoToeslag = (inkJaar) => {
    if (!zorgtoeslag) return 0;
    const grens = huishouding==="alleenstaand" ? 38520 : 48500;
    if (inkJaar > grens) return 0;
    return Math.max(0, Math.round(154 - Math.max(0,inkJaar-23000)/grens*154));
  };
  // Huurtoeslag: max €305/mnd bij inkomen < €31.340 (alleenstaand)
  const htToeslag = (inkJaar) => {
    if (!huurder) return 0;
    const grens = huishouding==="alleenstaand" ? 31340 : 42000;
    if (inkJaar > grens) return 0;
    return Math.max(0, Math.round(305 - Math.max(0,inkJaar-22000)/grens*305));
  };

  const inkZonder    = totaalInkomenZonder * 12;
  const inkMet       = totaalInkomenMet    * 12;
  const zoZonder     = zoToeslag(inkZonder);
  const zoMet        = zoToeslag(inkMet);
  const htZonder     = htToeslag(inkZonder);
  const htMet        = htToeslag(inkMet);
  const netoZonder   = totaalInkomenZonder + zoZonder + htZonder;
  const netoMet      = totaalInkomenMet    + zoMet    + htMet;
  const toeslagenVerlies = (zoZonder + htZonder) - (zoMet + htMet);

  // Belastingeffect bedrag ineens (box 1, schijf 1 en 2)
  const belastingIneens = bedragIneens < 75518
    ? Math.round(bedragIneens * 0.3697)
    : Math.round(75518 * 0.3697 + (bedragIneens - 75518) * 0.4950);
  const nettoIneens = bedragIneens - belastingIneens;

  const Vergelijking = ({label, zonder, met, eenheid="/mnd", kleur=T.text}) => (
    <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`0.5px solid ${T.borderSec}`}}>
      <span style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>{label}</span>
      <div style={{display:"flex",gap:16,fontSize:11,fontFamily:T.mono}}>
        <span style={{color:T.textTer}}>{eur(zonder)}{eenheid}</span>
        <span style={{color:kleur,fontWeight:600}}>{eur(met)}{eenheid}</span>
        {zonder!==met&&<span style={{color:met<zonder?T.dangerText:T.accent,fontSize:10}}>
          {met<zonder?"▼":"▲"} {eur(Math.abs(met-zonder))}
        </span>}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Bedrag ineens — Toeslagen Impact Calculator</h2>
        <p style={{margin:0,fontSize:13,color:T.textSec}}>Bereken de netto impact van de 10%-regeling op het pensioen, de toeslagen en de belasting.</p>
      </div>

      <div style={{background:T.warnBg,border:`0.5px solid ${T.warn}44`,borderRadius:9,padding:"9px 13px",marginBottom:14,fontSize:11,color:T.warnText,fontFamily:T.font}}>
        ⚠ De inwerkingtreding van het keuzerecht bedrag ineens is uitgesteld tot 1 juli 2026. Gebruik deze calculator als planningsinstrument — leg keuzes vast als intentie tot de wet definitief is.
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
        {/* Invoer */}
        <Card style={{padding:"16px"}}>
          <div style={{fontSize:11,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:12,fontFamily:T.font}}>Invoer</div>

          {[
            ["Pensioenkapi taal op pensioendatum (€)", pensioenKap, setPensioenKap],
            ["Bruto jaarsalaris vóór pensioen (€)",    salaris,     setSalaris],
          ].map(([l,v,s])=>(
            <div key={l} style={{marginBottom:10}}>
              <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:4,fontFamily:T.font}}>{l}</label>
              <input type="number" value={v} onChange={e=>s(+e.target.value)} step={1000}
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.mono,color:T.text,background:T.bgSec,outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}

          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
              <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",fontFamily:T.font}}>Percentage ineens</label>
              <span style={{fontSize:22,fontWeight:700,color:T.accent,fontFamily:T.mono}}>{pct_ineens}%</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={pct_ineens} onChange={e=>setPctIneens(+e.target.value)} style={{width:"100%",accentColor:T.accent}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,fontFamily:T.font,marginTop:2}}>
              <span>1% minimum</span><span style={{fontWeight:600}}>{eur(bedragIneens)} bruto</span><span>10% maximum</span>
            </div>
          </div>

          <div style={{display:"flex",gap:12,marginBottom:10}}>
            <div style={{flex:1}}>
              <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:4,fontFamily:T.font}}>Huishoudsituatie</label>
              <select value={huishouding} onChange={e=>setHuishouding(e.target.value)} style={{width:"100%",padding:"7px 9px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none"}}>
                <option value="alleenstaand">Alleenstaand</option>
                <option value="samen">Samenwonend / gehuwd</option>
              </select>
            </div>
          </div>

          <div style={{display:"flex",gap:16,marginBottom:4}}>
            {[["Huurder (huurtoeslag)",huurder,setHuurder],["Zorgtoeslag ontvangen",zorgtoeslag,setZorgtoeslag]].map(([l,v,s])=>(
              <label key={l} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:T.textSec,fontFamily:T.font}}>
                <input type="checkbox" checked={v} onChange={e=>s(e.target.checked)} style={{accentColor:T.accent}}/>
                {l}
              </label>
            ))}
          </div>
        </Card>

        {/* Resultaten */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Bedrag ineens */}
          <Card style={{padding:"14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10,fontFamily:T.font}}>Bedrag ineens</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:4}}>
              {[
                [eur(bedragIneens), "Bruto bedrag",    T.text],
                [eur(belastingIneens), "Loonheffing (±)",T.dangerText],
                [eur(nettoIneens),  "Netto ontvangen", T.accent],
                [pct(Math.round(belastingIneens/bedragIneens*100)), "Effectief tarief", T.textSec],
              ].map(([v,l,k])=>(
                <div key={l} style={{background:T.bgSec,borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:10,color:T.textTer,textTransform:"uppercase",letterSpacing:".04em",marginBottom:2,fontFamily:T.font}}>{l}</div>
                  <div style={{fontSize:16,fontWeight:700,color:k,fontFamily:T.mono}}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Maandelijkse impact */}
          <Card style={{padding:"14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10,fontFamily:T.font}}>
              Maandinkomen — zonder vs. met bedrag ineens
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:16,marginBottom:4}}>
              <span style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>Zonder</span>
              <span style={{fontSize:10,fontWeight:600,color:T.accent,fontFamily:T.font}}>Met</span>
            </div>
            <Vergelijking label="Pensioenuitkering"    zonder={maandZonder}   met={maandMet}   kleur={T.dangerText}/>
            <Vergelijking label="AOW"                   zonder={aow}          met={aow}/>
            <Vergelijking label="Zorgtoeslag/mnd"       zonder={zoZonder}      met={zoMet}     kleur={zoMet<zoZonder?T.dangerText:T.accent}/>
            <Vergelijking label="Huurtoeslag/mnd"       zonder={htZonder}      met={htMet}     kleur={htMet<htZonder?T.dangerText:T.accent}/>
            <div style={{borderTop:`2px solid ${T.border}`,marginTop:4,paddingTop:8}}>
              <Vergelijking label="Totaal netto/mnd"   zonder={netoZonder}    met={netoMet}   kleur={netoMet<netoZonder?T.dangerText:T.accent}/>
            </div>
            {toeslagenVerlies > 0 && (
              <div style={{marginTop:8,padding:"7px 10px",background:T.warnBg,borderRadius:7,fontSize:11,color:T.warnText,fontFamily:T.font}}>
                ⚠ Door hogere inkomenstoets verliest de werknemer ~{eur(toeslagenVerlies)}/mnd aan toeslagen. Dit vermindert het netto-voordeel van het bedrag ineens.
              </div>
            )}
          </Card>

          {/* Terugverdientijd */}
          <Card style={{padding:"12px 14px",background:T.bgSec}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6,fontFamily:T.font}}>Terugverdientijd</div>
            <div style={{fontSize:12,color:T.textSec,fontFamily:T.font}}>
              Het nettobedrag ineens ({eur(nettoIneens)}) is {maandVerlies+toeslagenVerlies>0?`in ca. ${Math.ceil(nettoIneens/(maandVerlies+toeslagenVerlies))} maanden`:"direct"} "terug verdiend" door het maandelijkse tekort van {eur(maandVerlies+toeslagenVerlies)}/mnd.
              Bij een levensverwachting van 20 jaar pensioenperiode resulteert dit netto in {netoMet>netoZonder?"voordeel":"nadeel"} van {eur(Math.abs((netoMet-netoZonder)*12*20-nettoIneens))}.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MODULE 5 — PENSIOEN APK GESPREKSCHECKLIST
// ══════════════════════════════════════════════════════════════════

const APK_PUNTEN = [
  { id:"p1",  categorie:"Huidige situatie", label:"Huidige pensioenregeling uitgelegd (type, uitvoerder, premie%)", verplicht:true },
  { id:"p2",  categorie:"Huidige situatie", label:"Opgebouwd kapitaal/aanspraak per peildatum besproken",          verplicht:true },
  { id:"p3",  categorie:"Huidige situatie", label:"Was-wordt overzicht doorgenomen",                               verplicht:true },
  { id:"p4",  categorie:"Elders opgebouwd", label:"Eerdere dienstverbanden en slapers in kaart gebracht",          verplicht:true },
  { id:"p5",  categorie:"Elders opgebouwd", label:"Waardeoverdracht besproken (indien van toepassing)",            verplicht:false },
  { id:"p6",  categorie:"Keuzes",           label:"Lifecycle-keuze besproken en vastgelegd",                       verplicht:true },
  { id:"p7",  categorie:"Keuzes",           label:"Hoog/laag-constructie uitgelegd",                               verplicht:false },
  { id:"p8",  categorie:"Keuzes",           label:"Uitruil OP/PP besproken",                                       verplicht:false },
  { id:"p9",  categorie:"Keuzes",           label:"Bedrag ineens (10%-regeling) besproken",                        verplicht:false },
  { id:"p10", categorie:"Persoonlijke situatie", label:"ANW-hiaat situatie besproken",                             verplicht:true },
  { id:"p11", categorie:"Persoonlijke situatie", label:"Nabestaandenpensioen gecommuniceerd",                      verplicht:true },
  { id:"p12", categorie:"Persoonlijke situatie", label:"Pensioenleeftijd en AOW-datum besproken",                  verplicht:true },
  { id:"p13", categorie:"URM-projecties",   label:"Pessimistisch/verwacht/optimistisch scenario getoond",         verplicht:true },
  { id:"p14", categorie:"URM-projecties",   label:"Doelstelling werknemer getoetst aan URM-uitkomsten",           verplicht:false },
  { id:"p15", categorie:"Acties",           label:"Afgesproken acties samengevat",                                 verplicht:true },
  { id:"p16", categorie:"Acties",           label:"Samenvatting per e-mail verstuurd aan werknemer",               verplicht:true },
  { id:"p17", categorie:"Acties",           label:"Volgend contactmoment afgesproken",                             verplicht:false },
];

function ModuleAPK() {
  const [afgevinkt, setAfgevinkt]     = useState({});
  const [notities, setNotities]       = useState({});
  const [actief, setActief]           = useState("p1");
  const [werknemer, setWerknemer]     = useState("H. van Dijk");
  const [gespreksNotitie, setGespreksNotitie] = useState("");
  const [afgerond, setAfgerond]       = useState(false);

  const vink = (id) => setAfgevinkt(p => ({...p, [id]:!p[id]}));
  const categorieën = [...new Set(APK_PUNTEN.map(p => p.categorie))];

  const verplichtKlaar = APK_PUNTEN.filter(p=>p.verplicht).every(p=>afgevinkt[p.id]);
  const totaalKlaar    = APK_PUNTEN.filter(p=>afgevinkt[p.id]).length;
  const pctKlaar       = Math.round(totaalKlaar/APK_PUNTEN.length*100);

  return (
    <div>
      <div style={{marginBottom:18}}>
        <h2 style={{margin:"0 0 3px",fontSize:18,fontWeight:700,color:T.text,fontFamily:T.font}}>Pensioen APK-gesprekschecklist</h2>
        <p style={{margin:0,fontSize:13,color:T.textSec}}>Gestructureerde begeleiding voor het 1-op-1 APK-gesprek. Na afloop direct een samenvatting per e-mail naar de werknemer.</p>
      </div>

      {afgerond ? (
        <Card style={{padding:"32px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:14}}>✅</div>
          <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:6,fontFamily:T.font}}>APK-gesprek afgerond en opgeslagen</div>
          <div style={{fontSize:13,color:T.textSec,marginBottom:16,fontFamily:T.font}}>
            Samenvatting verstuurd naar {werknemer} · {totaalKlaar}/{APK_PUNTEN.length} punten besproken · {datNL(new Date().toISOString().slice(0,10))}
          </div>
          <button onClick={()=>{setAfgevinkt({});setGespreksNotitie("");setAfgerond(false);}} style={{padding:"8px 18px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.font}}>
            Nieuw APK-gesprek starten
          </button>
        </Card>
      ) : (
        <>
          {/* Header + voortgang */}
          <Card style={{padding:"14px 16px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
              <div style={{flex:1}}>
                <label style={{fontSize:10,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:4,fontFamily:T.font}}>Werknemer</label>
                <input value={werknemer} onChange={e=>setWerknemer(e.target.value)}
                  style={{padding:"7px 10px",borderRadius:7,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none",width:"100%",boxSizing:"border-box"}}/>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:700,color:T.accent,fontFamily:T.mono}}>{pctKlaar}%</div>
                <div style={{fontSize:10,color:T.textTer,fontFamily:T.font}}>Compleet</div>
              </div>
            </div>
            <div style={{height:8,background:T.bgSec,borderRadius:99,overflow:"hidden"}}>
              <div style={{width:`${pctKlaar}%`,height:"100%",background:T.accent,borderRadius:99,transition:"width .3s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,marginTop:3,fontFamily:T.font}}>
              <span>{totaalKlaar}/{APK_PUNTEN.length} punten</span>
              <span style={{color:verplichtKlaar?T.accent:T.warnText}}>
                {verplichtKlaar?"✓ Alle verplichte punten":"⚠ Verplichte punten nog open"}
              </span>
            </div>
          </Card>

          {/* Checklist per categorie */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            {categorieën.map(cat => {
              const punten = APK_PUNTEN.filter(p => p.categorie === cat);
              const catKlaar = punten.filter(p=>afgevinkt[p.id]).length;
              return (
                <Card key={cat} style={{overflow:"hidden"}}>
                  <div style={{padding:"9px 14px",background:T.bgSec,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`0.5px solid ${T.borderSec}`}}>
                    <span style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.font}}>{cat}</span>
                    <span style={{fontSize:11,fontFamily:T.mono,color:catKlaar===punten.length?T.accent:T.textTer}}>
                      {catKlaar}/{punten.length}
                    </span>
                  </div>
                  <div style={{padding:"6px 0"}}>
                    {punten.map(p => (
                      <div key={p.id}
                        style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 14px",cursor:"pointer",background:afgevinkt[p.id]?T.accentBg:"transparent",transition:"background .1s"}}
                        onClick={()=>vink(p.id)}>
                        <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${afgevinkt[p.id]?T.accent:T.border}`,background:afgevinkt[p.id]?T.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                          {afgevinkt[p.id]&&<span style={{color:"#fff",fontSize:12,fontWeight:700}}>✓</span>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,color:afgevinkt[p.id]?T.accent:T.text,fontFamily:T.font,textDecoration:afgevinkt[p.id]?"line-through":"none"}}>{p.label}</div>
                          {p.verplicht&&!afgevinkt[p.id]&&<span style={{fontSize:9,color:T.warnText,background:T.warnBg,padding:"1px 5px",borderRadius:4,fontFamily:T.font}}>Verplicht</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Gespreksnotitie + afronden */}
          <Card style={{padding:"16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textTer,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,fontFamily:T.font}}>Gespreksnotitie (wordt meegestuurd aan werknemer)</div>
            <textarea value={gespreksNotitie} onChange={e=>setGespreksNotitie(e.target.value)} rows={3}
              placeholder="Samenvatting van besproken punten, gemaakte keuzes en afgesproken acties…"
              style={{width:"100%",padding:"9px 11px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,color:T.text,background:T.bgSec,outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:10}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:T.textSec,fontFamily:T.font}}>
                {!verplichtKlaar&&<span style={{color:T.warnText}}>⚠ Vink eerst alle verplichte punten aan.</span>}
              </div>
              <button disabled={!verplichtKlaar} onClick={()=>setAfgerond(true)}
                style={{padding:"9px 20px",borderRadius:8,border:"none",background:verplichtKlaar?T.accent:T.border,color:"#fff",fontSize:13,fontWeight:600,cursor:verplichtKlaar?"pointer":"not-allowed",fontFamily:T.font,opacity:verplichtKlaar?1:.5}}>
                ✓ Gesprek afronden & samenvatting versturen
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT NAVIGATOR
// ══════════════════════════════════════════════════════════════════
const MODULES = [
  { id:"mpo",       icon:"📊", label:"MPO XML-import",       sub:"Slapers ophalen" },
  { id:"deadline",  icon:"📅", label:"Wtp-deadline tracker", sub:"Mijlpalen bewaken" },
  { id:"or",        icon:"🗳",  label:"OR-instemming",        sub:"WOR art. 27" },
  { id:"ineens",    icon:"💰", label:"Bedrag ineens",         sub:"Toeslagen impact" },
  { id:"apk",       icon:"☑️",  label:"APK-checklist",        sub:"1-op-1 gesprek" },
];

export default function NieuweModules() {
  const [actief, setActief] = useState("mpo");

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:T.font}}>
      {/* Topnav */}
      <div style={{background:T.bgCard,borderBottom:`0.5px solid ${T.border}`,padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:14,height:52}}>
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="4" width="22" height="22" rx="4" fill={T.text}/>
            <rect x="14" y="14" width="22" height="22" rx="4" fill="none" stroke={T.text} strokeWidth="1.5"/>
            <rect x="16" y="16" width="8" height="8" rx="1.5" fill="#fff"/>
          </svg>
          <span style={{fontSize:15,letterSpacing:"-.03em",color:T.text}}>
            <span style={{fontWeight:300}}>Advies</span><span style={{fontWeight:700}}>Focus</span>
          </span>
          <div style={{width:1,height:16,background:T.border}}/>
          <span style={{fontSize:12,color:T.textTer}}>Nieuwe modules — Sprint 7</span>
        </div>
        {/* Module tabs */}
        <div style={{display:"flex",gap:0}}>
          {MODULES.map(m => (
            <button key={m.id} onClick={()=>setActief(m.id)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",border:"none",borderBottom:actief===m.id?`2px solid ${T.accent}`:"2px solid transparent",background:"transparent",cursor:"pointer",fontFamily:T.font}}>
              <span style={{fontSize:14}}>{m.icon}</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:12,fontWeight:actief===m.id?600:400,color:actief===m.id?T.accent:T.textSec}}>{m.label}</div>
                <div style={{fontSize:9,color:T.textTer}}>{m.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"24px"}}>
        {actief==="mpo"     && <ModuleMPO/>}
        {actief==="deadline"&& <ModuleDeadlineTracker/>}
        {actief==="or"      && <ModuleOR/>}
        {actief==="ineens"  && <ModuleBedragIneens/>}
        {actief==="apk"     && <ModuleAPK/>}
      </div>
    </div>
  );
}
