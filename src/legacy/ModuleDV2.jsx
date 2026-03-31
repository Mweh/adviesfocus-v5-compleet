import { useState, useRef, useEffect } from "react";

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg: "#f7f6f3", bgCard: "#ffffff", bgSec: "#f1efe8",
  border: "rgba(15,15,14,0.10)", borderSec: "rgba(15,15,14,0.06)",
  text: "#0f0f0e", textSec: "rgba(15,15,14,0.55)", textTer: "rgba(15,15,14,0.38)",
  accent: "#1d9e75", warn: "#ef9f27", warnBg: "#faeeda", warnText: "#854f0b",
  danger: "#e24b4a", dangerBg: "#fcebeb", dangerText: "#a32d2d",
  font: "'Space Grotesk', system-ui, sans-serif",
};

// ─── BPF structuur: hoofdgroep → specifiek fonds ────────────────────────────
const BPF_HOOFDGROEPEN = [
  { id: "geen",    label: "Geen BPF van toepassing",        icon: "✓",  sub: [] },
  {
    id: "bouw",    label: "Bouw, Metaal & Techniek",         icon: "🔧",
    sub: [
      { id:"bpfBOUW",  naam:"BPF Bouw (Bouwnijverheid)" },
      { id:"PMT",      naam:"PMT — Metaal en Techniek" },
      { id:"PME",      naam:"PME — Metalektro" },
      { id:"SAG",      naam:"Schilders, Afwerking & Glas (SAG)" },
      { id:"WATERBOUW",naam:"Waterbouw" },
      { id:"HOUT",     naam:"Houtverwerkende industrie & Jachtbouw" },
      { id:"MEUBEL",   naam:"Meubelindustrie en Meubileringsbedrijven" },
    ],
  },
  {
    id: "handel",  label: "Handel, Diensten & Horeca",       icon: "🛒",
    sub: [
      { id:"StiPP",    naam:"StiPP — Personeelsdiensten / Uitzendbranche" },
      { id:"DETAIL",   naam:"Detailhandel" },
      { id:"HORECA",   naam:"Horeca & Catering" },
      { id:"LEVENSM",  naam:"Levensmiddelenbedrijf" },
      { id:"FSGIL",    naam:"Foodservice & Groothandel in Levensmiddelen" },
      { id:"SCHOON",   naam:"Schoonmaak- en Glazenwassersbedrijf" },
      { id:"REIS",     naam:"Reisbranche" },
      { id:"KAPPER",   naam:"Kappersbedrijf" },
      { id:"BEVEIL",   naam:"Particuliere Beveiliging" },
    ],
  },
  {
    id: "zorg",    label: "Zorg & Welzijn",                   icon: "🏥",
    sub: [
      { id:"PFZW",    naam:"PFZW — Zorg en Welzijn" },
      { id:"APOTH",   naam:"Apotheken" },
      { id:"HUIS",    naam:"Huisartsen / Dierenartsen / Fysiotherapeuten" },
    ],
  },
  {
    id: "vervoer", label: "Vervoer & Agrarisch",              icon: "🚛",
    sub: [
      { id:"BEROEPSV", naam:"Beroepsvervoer over de weg" },
      { id:"BPL",      naam:"BPL Pensioen — Agrarisch" },
      { id:"VLEES",    naam:"Vlees, Vleeswaren, Gemaksvoeding & Pluimveevlees" },
    ],
  },
  {
    id: "overig",  label: "Overig / Specialistisch",          icon: "📋",
    sub: [
      { id:"ARCH",   naam:"Architectenbureaus" },
      { id:"ZOET",   naam:"Zoetwarenindustrie" },
      { id:"SCHOEN", naam:"Schoen-, Leder- en Lederwarenindustrie" },
      { id:"ANDERS", naam:"Anders, namelijk…" },
    ],
  },
];

// ─── Kleine CAO dataset (representatief, zoekbaar) ──────────────────────────
const CAO_DATA = [
  {n:"BOUW & INFRA",c:"10"},{n:"BOUWBEDRIJF, UTA,",c:"517"},{n:"AFBOUW",c:"254"},
  {n:"METALEKTRO",c:"487"},{n:"METALEKTRO HOGER PERSONEEL",c:"488"},
  {n:"M EN T METAALBEWERKINGSBEDRIJF",c:"824"},{n:"M EN T TECHNISCH INSTALLATIEBEDRIJF",c:"2297"},
  {n:"SCHILDERS-, AFWERKINGS-, VASTGOEDONDERHOUDS- EN GLASZETBEDRIJF IN NEDERLAND",c:"759"},
  {n:"WATERBOUW",c:"80"},{n:"HOUTVERWERKENDE INDUSTRIE",c:"253"},
  {n:"INTERIEURBOUW EN MEUBELINDUSTRIE",c:"526"},
  {n:"HORECA- EN AANVERWANTE BEDRIJF",c:"182"},{n:"FNV HORECABOND",c:"4072"},
  {n:"CONTRACTCATERINGBRANCHE",c:"750"},{n:"LEVENSMIDDELENBEDRIJF",c:"316"},
  {n:"FOODSERVICE EN DE GROOTHANDEL IN LEVENSMIDDELEN (FSGIL)",c:"3854"},
  {n:"SCHOONMAAK- EN GLAZENWASSERSBEDRIJF",c:"433"},{n:"REISBRANCHE",c:"924"},
  {n:"KAPPERSBEDRIJF",c:"405"},{n:"PARTICULIERE BEVEILIGING",c:"496"},
  {n:"ABU CAO VOOR UITZENDKRACHTEN",c:"633"},{n:"NBBU UITZENDKRACHTEN",c:"1060"},
  {n:"RETAIL NON-FOOD",c:"727"},{n:"DOE-HET-ZELFBRANCHE",c:"1639"},
  {n:"ZIEKENHUIZEN",c:"156"},{n:"GEHANDICAPTENZORG",c:"317"},
  {n:"GEESTELIJKE GEZONDHEIDSZORG (GGZ)",c:"1574"},{n:"THUISZORG",c:"1045"},
  {n:"VERPLEEG- EN VERZORGINGSHUIZEN EN THUISZORG",c:"49"},
  {n:"APOTHEKEN",c:"50"},{n:"APOTHEKERS IN DIENSTVERBAND",c:"3821"},
  {n:"HUISARTSENZORG",c:"721"},{n:"HUISARTSEN IN LOONDIENST",c:"4345"},
  {n:"VRIJGEVESTIGDE FYSIOTHERAPIEPRAKTIJK",c:"1197"},
  {n:"BEROEPSGOEDERENVERVOER OVER DE WEG",c:"21"},
  {n:"GLASTUINBOUW",c:"1869"},{n:"HOVENIERSBEDRIJF IN NEDERLAND",c:"243"},
  {n:"VLEESSECTOR",c:"26"},{n:"VLEESWARENINDUSTRIE",c:"709"},
  {n:"GEMAKSVOEDINGINDUSTRIE",c:"279"},{n:"ARCHITECTENBUREAUS",c:"43"},
  {n:"ZOETWARENINDUSTRIE",c:"359"},{n:"SUIKERWERK- EN CHOCOLADEVERWERKENDE INDUSTRIE",c:"197"},
  {n:"RABOBANK",c:"1606"},{n:"BANKEN CAO",c:"632"},{n:"ING BANK",c:"1635"},
  {n:"VERZEKERINGSBEDRIJF, CAO VOOR HET",c:"637"},
  {n:"PRIMAIR ONDERWIJS",c:"1494"},{n:"VOORTGEZET ONDERWIJS VO",c:"1188"},
  {n:"HOGER BEROEPSONDERWIJS",c:"625"},{n:"NEDERLANDSE UNIVERSITEITEN",c:"1536"},
  {n:"RIJK CAO",c:"1646"},{n:"SECTOR POLITIE",c:"1636"},{n:"SECTOR DEFENSIE",c:"1597"},
  {n:"OPENBAAR VERVOER",c:"163"},{n:"NEDERLANDSE SPOORWEGEN (NS)",c:"603"},
  {n:"GOEDERENVERVOER NEDERLAND",c:"20"},{n:"BINNENSCHEEPVAART",c:"463"},
  {n:"KLM GRONDPERSONEEL",c:"72"},{n:"KLM-CABINEPERSONEEL",c:"914"},
  {n:"TRANSAVIA AIRLINES GRONDPERSONEEL",c:"100"},
  {n:"TECHNISCHE GROOTHANDEL",c:"730"},{n:"GRAFIMEDIA",c:"1287"},
  {n:"PAPIERINDUSTRIE",c:"776"},{n:"ZUIVELINDUSTRIE I",c:"157"},
  {n:"TATA STEEL",c:"1709"},{n:"PHILIPS CAO",c:"15"},
  {n:"UNILEVER NEDERLAND",c:"644"},{n:"HEINEKEN NEDERLAND B.V.",c:"4139"},
  {n:"ALBERT HEIJN BV CAO LOGISTIEK",c:"448"},
  {n:"POSTNL CAO VOOR POSTNL",c:"1521"},
  {n:"WELZIJN MAATSCHAPPELIJKE DIENSTVERLENING SOCIAAL WERK",c:"301"},
  {n:"JEUGDZORG",c:"234"},{n:"KINDEROPVANG VOOR KINDERCENTRA EN GASTOUDEROPVANG",c:"1612"},
  {n:"PGGM",c:"44"},{n:"SOCIALE VERZEKERINGSBANK",c:"1353"},
  {n:"UITVOERINGSINSTITUUT WERKNEMERSVERZEKERINGEN (UWV)",c:"1849"},
  {n:"ZORGVERZEKERAARS",c:"615"},{n:"ZORGVERVOER EN TAXI",c:"679"},
  {n:"DROGISTERIJBRANCHE VDF-CAO",c:"518"},{n:"OPTIEKBEDRIJVEN",c:"623"},
  {n:"UITVAARTBRANCHE",c:"3768"},{n:"MUSEUM CAO",c:"979"},
  {n:"SPORT, WERKGEVERSORGANISATIE IN DE",c:"475"},
  {n:"HOLLAND CASINO",c:"985"},{n:"RECREATIE",c:"1165"},
  {n:"SLAGERSBEDRIJF",c:"748"},{n:"BAKKERSBEDRIJF",c:"1496"},
  {n:"MOTORVOERTUIGENBEDRIJF EN TWEEWIELERBEDRIJF",c:"823"},
  {n:"TANKSTATIONS EN WASBEDRIJVEN",c:"1285"},
  {n:"GEEN REGULIERE CAO VAN TOEPASSING",c:"9999"},
];

const GRONDSLAGEN = ["% van Loonsom", "% van Arbeidsuren", "% van Omzet"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Lbl({ children, required }) {
  return (
    <div style={{ fontSize:11, fontWeight:500, color:T.textSec, marginBottom:6, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".04em" }}>
      {children}{required && <span style={{ color:T.danger }}> *</span>}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"22px 0 14px" }}>
      <div style={{ flex:1, height:"0.5px", background:T.border }} />
      <span style={{ fontSize:10, fontWeight:600, color:T.textTer, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".06em", whiteSpace:"nowrap" }}>{label}</span>
      <div style={{ flex:1, height:"0.5px", background:T.border }} />
    </div>
  );
}

// ─── CAO Combobox ─────────────────────────────────────────────────────────────
function CaoCombobox({ value, onChange }) {
  const [query, setQuery] = useState(value ? value.n : "");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef(null);

  const filtered = query.length < 2 ? [] : CAO_DATA.filter(c => c.n.toUpperCase().includes(query.toUpperCase())).slice(0, 40);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => setHi(0), [query]);

  const select = (item) => { onChange(item); setQuery(item.n); setOpen(false); };

  const onKey = (e) => {
    if (!open || !filtered.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h+1, filtered.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHi(h => Math.max(h-1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (filtered[hi]) select(filtered[hi]); }
    if (e.key === "Escape")    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div style={{ position:"relative" }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); onChange(null); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={onKey}
          placeholder="Typ om te zoeken (bijv. BOUW, HORECA, METAAL…)"
          style={{ width:"100%", padding:"9px 36px 9px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.bgCard, outline:"none", boxSizing:"border-box" }}
          onFocus_={e => e.target.style.borderColor = T.accent}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        {value && (
          <button onClick={() => { onChange(null); setQuery(""); }} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:T.textTer }}>×</button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:9, boxShadow:"0 8px 24px rgba(0,0,0,0.10)", zIndex:200, maxHeight:220, overflowY:"auto" }}>
          {filtered.map((item, i) => {
            const idx = item.n.toUpperCase().indexOf(query.toUpperCase());
            return (
              <div key={item.c} onMouseDown={() => select(item)}
                style={{ padding:"7px 12px", cursor:"pointer", background:i===hi?"#f0fdf9":"transparent", borderBottom:i<filtered.length-1?`0.5px solid ${T.borderSec}`:"none" }}
                onMouseEnter={() => setHi(i)}>
                <span style={{ fontSize:12, fontFamily:T.font, color:T.text }}>
                  {item.n.slice(0,idx)}<strong style={{ color:T.accent }}>{item.n.slice(idx,idx+query.length)}</strong>{item.n.slice(idx+query.length)}
                </span>
                <span style={{ fontSize:10, color:T.textTer, marginLeft:6 }}>#{item.c}</span>
              </div>
            );
          })}
        </div>
      )}
      {open && query.length >= 2 && filtered.length === 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:9, padding:12, fontSize:12, color:T.textSec, fontFamily:T.font, zIndex:200 }}>
          Geen resultaat — probeer anders te spellen of kies "Geen reguliere CAO".
        </div>
      )}
    </div>
  );
}

// ─── Volgende stap card ───────────────────────────────────────────────────────
function AnalysePreview({ klaarVoorAnalyse }) {
  const stappen = [
    { num:"2.1", naam:"WTP-Transitie & Compensatie", desc:"Berekening was/wordt per werknemer, compensatielast per cohort", gereed:false },
    { num:"2.2", naam:"Markt- & Productvergelijking", desc:"Offertes van ≥3 aanbieders naast elkaar, scoremodel op doelstellingen", gereed:false },
    { num:"2.3", naam:"Beleggingsbeleid & Lifecycles", desc:"Lifecycle-visualisatie, URM-projecties in 3 scenario's", gereed:false },
  ];
  return (
    <div style={{ background:T.bgCard, border:`0.5px solid ${klaarVoorAnalyse?T.accent+"44":T.border}`, borderRadius:12, padding:"16px 18px", marginTop:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:T.font }}>Volgende stap: Analyse (Stap 2 van 3)</div>
          <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font, marginTop:2 }}>Na opslaan van het klantprofiel start de rekenkern</div>
        </div>
        {klaarVoorAnalyse && (
          <div style={{ fontSize:11, fontWeight:500, color:T.accent, background:"#e0f2ee", padding:"4px 10px", borderRadius:99, fontFamily:T.font }}>Gereed om te starten</div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {stappen.map(s => (
          <div key={s.num} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 10px", background:T.bgSec, borderRadius:8 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:T.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:10, fontWeight:700, color:T.textTer, fontFamily:T.font }}>{s.num}</span>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:500, color:T.text, fontFamily:T.font }}>{s.naam}</div>
              <div style={{ fontSize:11, color:T.textTer, fontFamily:T.font, marginTop:1 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Module D ─────────────────────────────────────────────────────────────────
export default function ModuleD() {
  const [d, setD] = useState({
    activiteiten: [{ id:1, naam:"", perc:"", grondslag:"% van Loonsom" }],
    bpfHoofd: null,       // id van hoofdgroep
    bpfSub: null,         // {id, naam} van specifiek fonds
    bpfAnders: "",        // vrij tekstveld bij 'anders'
    bpfBesluit: null,     // "verplicht" | "dispensatie" | "geen_plicht"
    cao: null,
    or: null,
  });

  const set = u => setD(p => ({ ...p, ...u }));

  // activiteiten
  const actTotaal = d.activiteiten.reduce((s, a) => s + (parseFloat(a.perc)||0), 0);
  const overschrijding = actTotaal > 100;
  const hoofdzakelijk = d.activiteiten.find(a => parseFloat(a.perc) > 50);
  const addRij = () => set({ activiteiten:[...d.activiteiten, { id:Date.now(), naam:"", perc:"", grondslag:"% van Loonsom" }] });
  const updRij = (id, f, v) => set({ activiteiten:d.activiteiten.map(a => a.id===id ? { ...a, [f]:v } : a) });
  const delRij = (id) => { if (d.activiteiten.length>1) set({ activiteiten:d.activiteiten.filter(a => a.id!==id) }); };

  // BPF logica
  const gekozenHoofd = BPF_HOOFDGROEPEN.find(g => g.id === d.bpfHoofd);
  const isGeen = d.bpfHoofd === "geen";
  const heeftSub = gekozenHoofd?.sub?.length > 0;
  const bpfBlok = d.bpfBesluit === "verplicht";
  const bpfNaam = d.bpfSub?.naam || (d.bpfHoofd === "geen" ? "Geen BPF" : null);

  // klaar check
  const klaarVoorAnalyse = !bpfBlok && (d.bpfHoofd || d.bpfBesluit) && d.cao;

  useEffect(() => {
    if (!document.getElementById("af-font")) {
      const l = document.createElement("link"); l.id="af-font"; l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div style={{ fontFamily:T.font, maxWidth:660, margin:"0 auto", padding:24, background:T.bg, minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:T.accent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600 }}>D</div>
          <h2 style={{ margin:0, fontSize:17, fontWeight:600, color:T.text }}>Module D — Kader & Verplichtingen</h2>
        </div>
        <p style={{ margin:0, fontSize:12, color:T.textSec }}>Externe beperkingen die het adviestraject bepalen: activiteiten, BPF-plicht en CAO.</p>
      </div>

      {/* ── STAP 1: Activiteiten ─────────────────────────────────────────── */}
      <Divider label="Stap 1 — Bedrijfsactiviteiten & Percentages" />
      <p style={{ fontSize:12, color:T.textSec, marginBottom:12, marginTop:0 }}>
        Voer de activiteiten in en het aandeel. Bij &gt;50% op één activiteit toetst het platform het hoofdzakelijkheidscriterium.
      </p>

      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, overflow:"hidden", marginBottom:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 88px 156px 36px", padding:"7px 12px", background:T.bgSec, borderBottom:`0.5px solid ${T.border}` }}>
          {["Activiteit / omschrijving","% aandeel","Grondslag",""].map((h,i) => (
            <div key={i} style={{ fontSize:10, fontWeight:600, color:T.textTer, textTransform:"uppercase", letterSpacing:".05em" }}>{h}</div>
          ))}
        </div>
        {d.activiteiten.map(a => (
          <div key={a.id} style={{ display:"grid", gridTemplateColumns:"1fr 88px 156px 36px", padding:"7px 12px", borderBottom:`0.5px solid ${T.borderSec}`, alignItems:"center" }}>
            <input value={a.naam} onChange={e => updRij(a.id,"naam",e.target.value)} placeholder="bijv. Installatie warmtepompen"
              style={{ padding:"6px 8px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, color:T.text, background:"transparent", outline:"none", width:"100%", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor=T.accent} onBlur={e => e.target.style.borderColor=T.border} />
            <div style={{ display:"flex", alignItems:"center", padding:"0 8px" }}>
              <input value={a.perc} onChange={e => updRij(a.id,"perc",e.target.value)} placeholder="60" type="number" min="0" max="100"
                style={{ width:48, padding:"6px 8px", borderRadius:6, border:`1px solid ${parseFloat(a.perc)>50?"#ef9f27":T.border}`, fontSize:12, fontFamily:T.font, color:T.text, background:"transparent", outline:"none", boxSizing:"border-box" }} />
              <span style={{ fontSize:11, color:T.textTer, marginLeft:3 }}>%</span>
            </div>
            <select value={a.grondslag} onChange={e => updRij(a.id,"grondslag",e.target.value)}
              style={{ padding:"6px 8px", borderRadius:6, border:`1px solid ${T.border}`, fontSize:11, fontFamily:T.font, color:T.text, background:T.bgCard, outline:"none" }}>
              {GRONDSLAGEN.map(g => <option key={g}>{g}</option>)}
            </select>
            <button onClick={() => delRij(a.id)} disabled={d.activiteiten.length<=1}
              style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.border}`, background:"none", cursor:d.activiteiten.length>1?"pointer":"not-allowed", color:T.textTer, fontSize:16, opacity:d.activiteiten.length>1?1:0.3, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 12px", background:T.bgSec }}>
          <button onClick={addRij} style={{ fontSize:12, color:T.accent, background:"none", border:"none", cursor:"pointer", fontFamily:T.font, fontWeight:500 }}>+ Activiteit toevoegen</button>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, color:T.textTer }}>Totaal:</span>
            <span style={{ fontSize:13, fontWeight:600, color: overschrijding?T.danger:actTotaal===100?T.accent:T.text }}>{actTotaal}%</span>
          </div>
        </div>
      </div>

      {overschrijding && (
        <div style={{ background:T.dangerBg, border:`0.5px solid ${T.danger}44`, borderRadius:8, padding:"8px 12px", marginBottom:8, fontSize:12, color:T.dangerText }}>
          ⚠ Totaal overschrijdt 100%. Controleer de percentages.
        </div>
      )}
      {hoofdzakelijk && !overschrijding && (
        <div style={{ background:T.warnBg, border:`0.5px solid ${T.warn}44`, borderRadius:8, padding:"8px 12px", marginBottom:8, fontSize:12, color:T.warnText }}>
          <strong>Hoofdzakelijkheidscriterium ({parseFloat(hoofdzakelijk.perc)}%)</strong> mogelijk bereikt voor
          activiteit "{hoofdzakelijk.naam||"(onbenoemd)"}". Controleer in stap 2 de werkingssfeer van het relevante BPF.
        </div>
      )}

      {/* ── STAP 2: BPF — twee dropdowns ─────────────────────────────────── */}
      <Divider label="Stap 2 — BPF Selectie & Wft-Vastlegging" />

      {/* Dropdown 1: Hoofdgroep */}
      <Lbl required>Is er een Bedrijfstakpensioenfonds (BPF) van toepassing?</Lbl>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:14 }}>
        {BPF_HOOFDGROEPEN.map(g => {
          const sel = d.bpfHoofd === g.id;
          return (
            <div key={g.id}
              onClick={() => set({ bpfHoofd: sel ? null : g.id, bpfSub: null, bpfBesluit: g.id==="geen" ? "geen_plicht" : null })}
              style={{ padding:"9px 11px", borderRadius:9, border:`1px solid ${sel?T.accent:T.border}`, background:sel?(g.id==="geen"?"#e0f2ee":T.bgSec):T.bgCard, cursor:"pointer", transition:"all .1s" }}>
              <div style={{ fontSize:14, marginBottom:3 }}>{g.icon}</div>
              <div style={{ fontSize:12, fontWeight:500, color:sel?(g.id==="geen"?T.accent:T.text):T.text, fontFamily:T.font, lineHeight:1.3 }}>{g.label}</div>
            </div>
          );
        })}
      </div>

      {/* Dropdown 2: Specifiek fonds (alleen als hoofdgroep met sub gekozen) */}
      {gekozenHoofd && heeftSub && (
        <div style={{ marginBottom:14 }}>
          <Lbl required>Welk specifiek BPF?</Lbl>
          <select
            value={d.bpfSub?.id || ""}
            onChange={e => {
              const sub = gekozenHoofd.sub.find(s => s.id === e.target.value) || null;
              set({ bpfSub: sub });
            }}
            style={{ width:"100%", padding:"9px 11px", borderRadius:8, border:`1px solid ${d.bpfSub?T.accent:T.border}`, fontSize:13, fontFamily:T.font, color:d.bpfSub?T.text:T.textTer, background:T.bgCard, outline:"none" }}>
            <option value="">— Kies het specifieke fonds —</option>
            {gekozenHoofd.sub.map(s => <option key={s.id} value={s.id}>{s.naam}</option>)}
          </select>
          {d.bpfSub?.id === "ANDERS" && (
            <input value={d.bpfAnders} onChange={e => set({ bpfAnders:e.target.value })} placeholder="Naam van het BPF"
              style={{ width:"100%", marginTop:6, padding:"9px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.bgCard, outline:"none", boxSizing:"border-box" }} />
          )}
        </div>
      )}

      {/* Wft-besluit: alleen tonen als een fonds geselecteerd (niet 'geen') */}
      {gekozenHoofd && !isGeen && (d.bpfSub || !heeftSub) && (
        <div style={{ marginBottom:14 }}>
          <Lbl required>Wft-besluit (verplicht vastleggen)</Lbl>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[
              { id:"verplicht",   label:"BPF is verplicht", desc:"Adviesflow geblokkeerd — individuele regeling niet mogelijk", color:T.danger, bg:T.dangerBg },
              { id:"dispensatie", label:"Dispensatie verkregen", desc:"Adviesflow gaat door — bewijs in dossier vastleggen", color:T.warn, bg:T.warnBg },
              { id:"geen_plicht", label:"Geen BPF-plicht", desc:"Adviesflow gaat door — geen verplichting van toepassing", color:T.accent, bg:"#e0f2ee" },
            ].map(opt => {
              const sel = d.bpfBesluit === opt.id;
              return (
                <div key={opt.id} onClick={() => set({ bpfBesluit: sel ? null : opt.id })}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 13px", borderRadius:9, border:`1px solid ${sel?opt.color+"66":T.border}`, background:sel?opt.bg:T.bgCard, cursor:"pointer", transition:"all .1s" }}>
                  <div style={{ width:15, height:15, borderRadius:"50%", border:`2px solid ${sel?opt.color:T.border}`, background:sel?opt.color:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {sel && <div style={{ width:5, height:5, borderRadius:"50%", background:"#fff" }} />}
                  </div>
                  <div>
                    <span style={{ fontSize:13, fontWeight:500, color:sel?opt.color:T.text, fontFamily:T.font }}>{opt.label}</span>
                    <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font, marginLeft:6 }}>{opt.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Blokkering */}
      {bpfBlok && (
        <div style={{ background:T.dangerBg, border:`1px solid ${T.danger}55`, borderRadius:10, padding:"14px 16px", marginBottom:16, display:"flex", gap:10 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>⛔</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.dangerText, fontFamily:T.font, marginBottom:2 }}>Adviestraject geblokkeerd</div>
            <div style={{ fontSize:12, color:T.dangerText, fontFamily:T.font }}>
              {bpfNaam ? `${bpfNaam} is verplicht. ` : ""}Een individuele pensioenregeling is niet mogelijk. Leg de reden vast in het dossier en sluit de flow af.
            </div>
          </div>
        </div>
      )}

      {/* ── STAP 3: CAO ───────────────────────────────────────────────────── */}
      {!bpfBlok && (
        <>
          <Divider label="Stap 3 — CAO & OR" />

          <Lbl>CAO van toepassing</Lbl>
          <CaoCombobox value={d.cao} onChange={cao => set({ cao })} />
          {d.cao && (
            <div style={{ marginTop:6, background:"#f0fdf9", border:`0.5px solid ${T.accent}44`, borderRadius:8, padding:"7px 11px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:"#0f6e56", fontFamily:T.font }}>✓</span>
              <span style={{ fontSize:12, fontWeight:500, color:T.text, fontFamily:T.font }}>{d.cao.n}</span>
              <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>CAO #{d.cao.c}</span>
            </div>
          )}

          <div style={{ marginTop:16 }}>
            <Lbl>OR / PVT aanwezig</Lbl>
            <div style={{ display:"flex", gap:6 }}>
              {["Ja","Nee"].map(o => {
                const sel = d.or===o;
                return <button key={o} onClick={() => set({ or:o })} style={{ padding:"5px 14px", borderRadius:99, fontSize:12, border:`1px solid ${sel?T.accent:T.border}`, background:sel?T.accent:T.bgSec, color:sel?"#fff":T.textSec, cursor:"pointer", fontFamily:T.font }}>{o}</button>;
              })}
            </div>
            {d.or==="Ja" && (
              <div style={{ marginTop:6, fontSize:11, color:T.warnText, background:T.warnBg, padding:"6px 10px", borderRadius:7, display:"inline-block", fontFamily:T.font }}>
                ℹ OR/PVT instemmingstraject vereist bij wijziging (WOR art. 27)
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Samenvatting ──────────────────────────────────────────────────── */}
      {(d.bpfHoofd || d.cao) && (
        <>
          <Divider label="Vastlegging dossier" />
          <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
            {[
              ["Hoofdactiviteit", (() => { const top = [...d.activiteiten].sort((a,b)=>(parseFloat(b.perc)||0)-(parseFloat(a.perc)||0))[0]; return top?.naam ? `${top.naam} (${top.perc}% van ${top.grondslag})` : null; })()],
              ["BPF", bpfNaam],
              ["Wft-besluit", d.bpfBesluit === "verplicht" ? "BPF verplicht — flow geblokkeerd" : d.bpfBesluit === "dispensatie" ? "Dispensatie verkregen — flow door" : d.bpfBesluit === "geen_plicht" ? "Geen BPF-plicht — flow door" : null],
              ["CAO", d.cao ? `${d.cao.n} (CAO #${d.cao.c})` : null],
              ["OR / PVT", d.or],
            ].filter(([,v]) => v).map(([l,v]) => (
              <div key={l} style={{ display:"flex", padding:"5px 0", borderBottom:`0.5px solid ${T.borderSec}`, alignItems:"flex-start" }}>
                <span style={{ fontSize:11, color:T.textTer, width:120, flexShrink:0, fontFamily:T.font }}>{l}</span>
                <span style={{ fontSize:12, color:T.text, fontFamily:T.font, lineHeight:1.4 }}>{v}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Volgende stap: Analyse ─────────────────────────────────────────── */}
      <Divider label="Volgende stap na inventarisatie" />
      <AnalysePreview klaarVoorAnalyse={!!klaarVoorAnalyse} />

      {klaarVoorAnalyse && (
        <div style={{ marginTop:16, display:"flex", justifyContent:"flex-end" }}>
          <button style={{ padding:"10px 22px", borderRadius:9, background:T.accent, color:"#fff", border:"none", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:T.font, display:"flex", alignItems:"center", gap:8 }}>
            Klantprofiel opslaan & naar analyse
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
