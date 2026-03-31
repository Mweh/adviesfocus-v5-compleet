import { useState } from "react";

// ─── Design tokens (gebaseerd op v4 codebase) ─────────────────────────────────
const T = {
  bg:        "#f7f6f3",
  bgCard:    "#ffffff",
  bgSec:     "#f1efe8",
  border:    "rgba(15,15,14,0.10)",
  borderSec: "rgba(15,15,14,0.06)",
  text:      "#0f0f0e",
  textSec:   "rgba(15,15,14,0.55)",
  textTer:   "rgba(15,15,14,0.38)",
  accent:    "#1d9e75",
  font:      "'Space Grotesk', system-ui, sans-serif",
};

const initialen = (naam) =>
  naam.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

function Badge({ status, fase }) {
  const map = {
    Nieuw:         { bg: "#f1efe8", color: "rgba(15,15,14,0.45)", dot: "rgba(15,15,14,0.25)" },
    Adviestraject: { bg: "#faeeda", color: "#854f0b",              dot: "#ef9f27" },
    "In beheer":   { bg: "#e0f2ee", color: "#0f6e56",              dot: "#1d9e75" },
  };
  const s = map[status] || map["Nieuw"];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:s.bg, color:s.color, borderRadius:99, padding:"3px 9px", fontSize:11, fontWeight:500, fontFamily:T.font }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
      {status}{fase ? ` · ${fase}` : ""}
    </span>
  );
}

function ProgressBar({ value }) {
  const color = value === 100 ? T.accent : value > 0 ? "#ef9f27" : "#e2e0d9";
  return (
    <div style={{ background:"#e2e0d9", borderRadius:99, height:3, overflow:"hidden", marginTop:6 }}>
      <div style={{ width:`${value}%`, background:color, height:"100%", borderRadius:99, transition:"width .3s" }} />
    </div>
  );
}

function Logo({ size = 26 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect x="4" y="4" width="22" height="22" rx="4" fill="#0f0f0e" />
        <rect x="14" y="14" width="22" height="22" rx="4" fill="none" stroke="#0f0f0e" strokeWidth="1.5" />
        <rect x="16" y="16" width="8" height="8" rx="1.5" fill="#ffffff" />
      </svg>
      <span style={{ fontSize:14, fontFamily:T.font, letterSpacing:"-.01em" }}>
        <span style={{ fontWeight:300, color:T.text }}>Advies</span>
        <span style={{ fontWeight:600, color:T.text }}>Focus</span>
      </span>
    </div>
  );
}

function Nav({ onHome }) {
  return (
    <nav style={{
      height:48, borderBottom:`0.5px solid ${T.border}`, background:"rgba(247,246,243,0.94)",
      backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 24px", position:"sticky", top:0, zIndex:50,
    }}>
      <button onClick={onHome} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
        <Logo />
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>Meer tijd voor uw klant.</span>
        <div style={{ width:1, height:14, background:T.border }} />
        <span style={{ fontSize:11, color:T.textSec, fontFamily:T.font }}>Demo Kantoor</span>
        <div style={{ width:1, height:14, background:T.border }} />
        <div style={{
          width:28, height:28, borderRadius:"50%", background:`${T.accent}22`,
          color:T.accent, fontSize:11, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center",
          border:`0.5px solid ${T.accent}44`, fontFamily:T.font,
        }}>DA</div>
      </div>
    </nav>
  );
}

const MOCK_KLANTEN_INIT = [
  { id:"1", naam:"Oranje Techniek B.V.", kvk:"12345678", contact:"Jan de Vries", email:"j.devries@oranjetechniek.nl", tel:"070-1234567", stad:"Den Haag", status:"Adviestraject", fase:"Inventarisatie", progress:35 },
  { id:"2", naam:"Bakker Logistics", kvk:"87654321", contact:"M. Bakker", email:"m.bakker@bakkerlogistics.nl", tel:"020-9876543", stad:"Amsterdam", status:"In beheer", fase:null, progress:100 },
  { id:"3", naam:"De Groot Installatie", kvk:"11223344", contact:"P. de Groot", email:"p.degroot@dgi.nl", tel:"015-5551234", stad:"Delft", status:"Nieuw", fase:null, progress:0 },
];

function NieuweKlantModal({ onClose, onSave }) {
  const [f, setF] = useState({ naam:"", contact:"", functie:"", email:"", tel:"", kvk:"", straat:"", postcode:"", stad:"" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const inp = (label, key, placeholder, required=false) => (
    <div key={key} style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:500, color:T.textSec, marginBottom:5, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".04em" }}>
        {label}{required ? " *" : ""}
      </div>
      <input
        value={f[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"9px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, outline:"none", boxSizing:"border-box", color:T.text, background:T.bgCard, fontFamily:T.font }}
        onFocus={e => e.target.style.borderColor = T.accent}
        onBlur={e => e.target.style.borderColor = T.border}
      />
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,15,14,0.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:T.bgCard, borderRadius:14, width:520, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"24px 28px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <div>
              <h2 style={{ margin:0, fontSize:17, fontWeight:600, color:T.text, fontFamily:T.font }}>Nieuwe werkgever</h2>
              <p style={{ margin:"3px 0 0", fontSize:12, color:T.textSec, fontFamily:T.font }}>Vul de basisgegevens in</p>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, cursor:"pointer", fontSize:18, color:T.textSec }}>×</button>
          </div>

          <p style={{ fontSize:11, fontWeight:600, color:T.textTer, marginBottom:10, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".06em" }}>Bedrijfsgegevens</p>
          {inp("Bedrijfsnaam","naam","Oranje Techniek B.V.",true)}
          {inp("KVK-nummer","kvk","12345678",true)}

          <p style={{ fontSize:11, fontWeight:600, color:T.textTer, margin:"18px 0 10px", fontFamily:T.font, textTransform:"uppercase", letterSpacing:".06em" }}>Contactpersoon</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 14px" }}>
            <div>{inp("Naam","contact","Jan de Vries",true)}</div>
            <div>{inp("Functie","functie","HR Manager")}</div>
          </div>
          {inp("E-mailadres","email","j.devries@bedrijf.nl",true)}
          {inp("Telefoonnummer","tel","070-1234567")}

          <p style={{ fontSize:11, fontWeight:600, color:T.textTer, margin:"18px 0 10px", fontFamily:T.font, textTransform:"uppercase", letterSpacing:".06em" }}>Adresgegevens</p>
          {inp("Straat + huisnummer","straat","Parkstraat 12")}
          <div style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:"0 14px" }}>
            <div>{inp("Postcode","postcode","2514 JK")}</div>
            <div>{inp("Stad","stad","Den Haag")}</div>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:20, paddingTop:18, borderTop:`1px solid ${T.borderSec}` }}>
            <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:13, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>Annuleren</button>
            <button
              onClick={() => { if(f.naam && f.kvk && f.email) { onSave(f); onClose(); } }}
              style={{ padding:"8px 18px", borderRadius:8, border:"none", background:f.naam&&f.kvk&&f.email?T.accent:"#b2d8cd", color:"#fff", fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:T.font }}
            >Klant toevoegen</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ klanten, onNieuw, onKlant }) {
  const [zoek, setZoek] = useState("");
  const [showModal, setShowModal] = useState(false);
  const uur = new Date().getHours();
  const groet = uur < 12 ? "Goedemorgen" : uur < 18 ? "Goedemiddag" : "Goedenavond";
  const gefilterd = klanten.filter(k => k.naam.toLowerCase().includes(zoek.toLowerCase()) || k.kvk.includes(zoek));
  const stats = {
    totaal: klanten.length,
    nieuw:  klanten.filter(k => k.status==="Nieuw").length,
    actief: klanten.filter(k => k.status==="Adviestraject").length,
    beheer: klanten.filter(k => k.status==="In beheer").length,
  };

  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"28px 24px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500, color:T.text, fontFamily:T.font, marginBottom:2 }}>{groet}, Demo Adviseur.</div>
          <div style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>
            {stats.nieuw > 0 ? `${stats.nieuw} klant${stats.nieuw>1?"en":""} nog zonder actie` : "Alle klanten zijn actief bijgewerkt"}
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding:"7px 14px", borderRadius:8, background:T.accent, color:"#fff", border:"none", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:T.font }}>
          + Klant toevoegen
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:22 }}>
        {[
          { label:"Totaal", val:stats.totaal, color:T.text },
          { label:"Nieuw", val:stats.nieuw, color:stats.nieuw>0?"rgba(15,15,14,0.5)":T.textTer },
          { label:"Adviestraject", val:stats.actief, color:stats.actief>0?"#854f0b":T.textTer },
          { label:"In beheer", val:stats.beheer, color:stats.beheer>0?T.accent:T.textTer },
        ].map(s => (
          <div key={s.label} style={{ background:T.bgSec, borderRadius:9, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:T.textTer, marginBottom:3, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".04em" }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:500, color:s.color, fontFamily:T.font }}>{s.val}</div>
          </div>
        ))}
      </div>

      <input
        value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek op naam of KvK…"
        style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`0.5px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.bgCard, outline:"none", marginBottom:14, boxSizing:"border-box" }}
      />

      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {gefilterd.map(k => (
          <div
            key={k.id}
            onClick={() => onKlant(k)}
            style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"12px 14px", cursor:"pointer", transition:"all .12s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent+"66"; e.currentTarget.style.background="#fafffd"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bgCard; }}
          >
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:`${T.accent}14`, border:`1px solid ${T.accent}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, color:T.accent, flexShrink:0, fontFamily:T.font }}>
                {initialen(k.naam)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:T.text, fontFamily:T.font }}>{k.naam}</span>
                  <Badge status={k.status} fase={k.fase} />
                </div>
                <div style={{ display:"flex", gap:10, fontSize:11, color:T.textTer, fontFamily:T.font }}>
                  <span>KvK {k.kvk}</span>
                  {k.stad && <span>· {k.stad}</span>}
                  {k.contact && <span>· {k.contact}</span>}
                </div>
                {k.progress > 0 && k.progress < 100 && <ProgressBar value={k.progress} />}
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color:T.textTer, flexShrink:0 }}>
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {showModal && <NieuweKlantModal onClose={() => setShowModal(false)} onSave={(f) => { onNieuw(f); }} />}
    </div>
  );
}

function KlantPagina({ klant, onTerug, onStartAdvies }) {
  const acties = [
    { id:"advies", naam:"Adviestraject", desc:"Inventarisatie, analyse en adviesrapport", kleur:T.accent, bg:"#e0f2ee", actief:true },
    { id:"beheer", naam:"Beheer & Nazorg", desc:"Monitoring, alerts en communicatie", kleur:"#3c3489", bg:"#edeaf8", actief:false },
  ];
  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"28px 24px" }}>
      <button onClick={onTerug} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", fontSize:12, color:T.textTer, fontFamily:T.font, padding:0, marginBottom:20 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Alle klanten
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <div style={{ width:44, height:44, borderRadius:11, background:`${T.accent}14`, border:`1px solid ${T.accent}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:600, color:T.accent, fontFamily:T.font }}>
          {initialen(klant.naam)}
        </div>
        <div>
          <div style={{ fontSize:17, fontWeight:500, color:T.text, fontFamily:T.font }}>{klant.naam}</div>
          <div style={{ fontSize:11, color:T.textTer, fontFamily:T.font, display:"flex", gap:8 }}>
            <span>KvK {klant.kvk}</span>
            {klant.stad && <span>· {klant.stad}</span>}
            {klant.contact && <span>· {klant.contact}</span>}
          </div>
        </div>
        <div style={{ marginLeft:"auto" }}><Badge status={klant.status} fase={klant.fase} /></div>
      </div>

      <p style={{ fontSize:11, fontWeight:600, color:T.textTer, marginBottom:10, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".05em" }}>Traject starten</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:28 }}>
        {acties.map(a => (
          <div
            key={a.id}
            onClick={() => a.actief && onStartAdvies()}
            style={{ background:a.actief ? a.bg : T.bgSec, border:`0.5px solid ${a.actief ? a.kleur+"44" : T.border}`, borderRadius:11, padding:"14px 16px", cursor:a.actief?"pointer":"not-allowed", opacity:a.actief?1:0.5, transition:"all .12s" }}
          >
            <div style={{ fontSize:13, fontWeight:500, color:a.kleur, fontFamily:T.font, marginBottom:3 }}>{a.naam}</div>
            <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font }}>{a.desc}</div>
            {!a.actief && <div style={{ fontSize:10, color:T.textTer, marginTop:4, fontFamily:T.font }}>Binnenkort beschikbaar</div>}
          </div>
        ))}
      </div>

      <p style={{ fontSize:11, fontWeight:600, color:T.textTer, marginBottom:10, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".05em" }}>Basisgegevens</p>
      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:10, padding:"14px 16px" }}>
        {[["Bedrijfsnaam",klant.naam],["KvK-nummer",klant.kvk],["Contactpersoon",klant.contact],["E-mailadres",klant.email],["Telefoon",klant.tel],["Stad",klant.stad]].filter(([,v])=>v).map(([l,v]) => (
          <div key={l} style={{ display:"flex", borderBottom:`0.5px solid ${T.borderSec}`, padding:"7px 0", alignItems:"center" }}>
            <span style={{ fontSize:11, color:T.textTer, width:130, flexShrink:0, fontFamily:T.font }}>{l}</span>
            <span style={{ fontSize:12, color:T.text, fontFamily:T.font }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Wizard helpers ───────────────────────────────────────────────────────────
function Lbl({ children }) {
  return <div style={{ fontSize:11, fontWeight:500, color:T.textSec, marginBottom:6, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".04em" }}>{children}</div>;
}
function Inp({ value, placeholder, onChange }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"9px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.bgCard, outline:"none", boxSizing:"border-box" }}
      onFocus={e => e.target.style.borderColor = T.accent}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  );
}
function Toggle({ opties, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
      {opties.map(o => {
        const sel = value === o;
        return <button key={o} onClick={() => onChange(o)} style={{ padding:"5px 12px", borderRadius:99, fontSize:12, border:`1px solid ${sel ? T.accent : T.border}`, background:sel ? T.accent : T.bgSec, color:sel ? "#fff" : T.textSec, cursor:"pointer", fontFamily:T.font }}>{o}</button>;
      })}
    </div>
  );
}

// ─── Modules ──────────────────────────────────────────────────────────────────
function ModuleA({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const omzet = data.omzetJaren || [{jaar:2022,waarde:""},{jaar:2023,waarde:""},{jaar:2024,waarde:""}];
  const perc = () => {
    const b = parseFloat(data.pensioenBudget||0), l = parseFloat(data.loonsom||0);
    if (!b||!l) return null;
    return ((b/l)*100).toFixed(1);
  };
  const p = perc();

  return (
    <div>
      <h3 style={{ fontSize:15, fontWeight:600, color:T.text, fontFamily:T.font, margin:"0 0 4px" }}>Module A — Financiële Positie</h3>
      <p style={{ fontSize:12, color:T.textSec, fontFamily:T.font, marginBottom:22 }}>Kan de werkgever de pensioenlasten dragen, nu en in de toekomst?</p>

      <Lbl>Omzet laatste 3 jaar (€)</Lbl>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:18 }}>
        {omzet.map((j, i) => (
          <div key={j.jaar}>
            <div style={{ fontSize:11, color:T.textTer, marginBottom:4, fontFamily:T.font }}>{j.jaar}</div>
            <Inp value={j.waarde} placeholder="bv. 2.500.000" onChange={v => {
              const nw = [...omzet]; nw[i]={...j,waarde:v}; onChange({...data,omzetJaren:nw});
            }} />
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
        <div><Lbl>Bedrijfsresultaat 2024 (€)</Lbl><Inp value={data.bedrijfsresultaat||""} placeholder="bv. 450.000" onChange={v=>set("bedrijfsresultaat",v)} /></div>
        <div><Lbl>Totale loonsom (€)</Lbl><Inp value={data.loonsom||""} placeholder="bv. 1.200.000" onChange={v=>set("loonsom",v)} /></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
        <div><Lbl>Huidig pensioenbudget (€/jaar)</Lbl><Inp value={data.pensioenBudget||""} placeholder="bv. 95.000" onChange={v=>set("pensioenBudget",v)} /></div>
        <div><Lbl>Verwacht budget komende 5 jaar (€/jaar)</Lbl><Inp value={data.pensioenBudgetToekomst||""} placeholder="bv. 110.000" onChange={v=>set("pensioenBudgetToekomst",v)} /></div>
      </div>

      {p !== null && (
        <div style={{ background:parseFloat(p)>15?"#fcebeb":"#e0f2ee", border:`0.5px solid ${parseFloat(p)>15?"#e24b4a44":T.accent+"44"}`, borderRadius:9, padding:"10px 14px", marginBottom:18 }}>
          <div style={{ fontSize:12, fontWeight:600, color:parseFloat(p)>15?"#a32d2d":"#0f6e56", fontFamily:T.font }}>
            Pensioenlasten als % van loonsom: <strong>{p}%</strong>
          </div>
          <div style={{ fontSize:11, color:parseFloat(p)>15?"#a32d2d":"#0f6e56", marginTop:2, fontFamily:T.font }}>
            {parseFloat(p)>15?"⚠ Aandachtspunt: boven signaleringsgrens van 15%":"✓ Binnen de signaleringsgrens van 15%"}
          </div>
        </div>
      )}

      <Lbl>Jaarrekening uploaden (optioneel, PDF)</Lbl>
      <div style={{ border:`1.5px dashed ${T.border}`, borderRadius:9, padding:"14px 16px", textAlign:"center", background:T.bgSec, cursor:"pointer" }}>
        <div style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>📎 Sleep een PDF hier of klik om te uploaden</div>
        <div style={{ fontSize:11, color:T.textTer, marginTop:3, fontFamily:T.font }}>Optioneel · voor onderbouwing dossier</div>
      </div>
    </div>
  );
}

function ModuleB({ data, onChange }) {
  const vragen = [
    { id:"q1", groep:"Ervaring met pensioenregelingen", vraag:"Heeft uw onderneming momenteel een actieve pensioenregeling voor het personeel?", opties:["Ja","Nee","In het verleden gehad"] },
    { id:"q2", groep:"Ervaring met pensioenregelingen", vraag:"Hoe bent u betrokken bij het beheer van de huidige regeling?", opties:["Ik doe het zelf","Ik besteed het volledig uit aan een adviseur","Ik overleg periodiek met een adviseur"] },
    { id:"q3", groep:"Kennis van het pensioensysteem (Wtp)", vraag:"Bent u bekend met de wijzigingen vanuit de Wet toekomst pensioenen (Wtp), specifiek de overgang naar een 'vlakke premie'?", opties:["Ja, volledig","Gedeeltelijk van gehoord","Nee, onbekend"] },
    { id:"q4", groep:"Kennis van het pensioensysteem (Wtp)", vraag:"Begrijpt u het verschil tussen een uitkeringsovereenkomst (gegarandeerd pensioen) en een premieovereenkomst (uitkomst onzeker)?", opties:["Ja","Nee"] },
    { id:"q5", groep:"Kennis van beleggen", vraag:"Bent u bekend met het concept 'lifecycle-beleggen' (het afbouwen van risico naarmate de pensioendatum nadert)?", opties:["Ja","Nee"] },
    { id:"q6", groep:"Kennis van beleggen", vraag:"Begrijpt u dat bij een beschikbare premieregeling het beleggingsrisico volledig bij de werknemer ligt?", opties:["Ja","Nee"] },
  ];
  const set = (id, v) => onChange({ ...data, [id]: v });
  const positief = { q1:["Ja"], q2:["Ik overleg periodiek met een adviseur"], q3:["Ja, volledig"], q4:["Ja"], q5:["Ja"], q6:["Ja"] };
  const sc = vragen.filter(v => positief[v.id]?.includes(data[v.id])).length;
  const niveau = sc <= 2 ? { label:"Basis", kleur:"#e24b4a", bg:"#fcebeb" } : sc <= 4 ? { label:"Gemiddeld", kleur:"#ef9f27", bg:"#faeeda" } : { label:"Ervaren", kleur:T.accent, bg:"#e0f2ee" };
  const groepen = [...new Set(vragen.map(v => v.groep))];
  const antwoorden = Object.keys(data).length;

  return (
    <div>
      <h3 style={{ fontSize:15, fontWeight:600, color:T.text, fontFamily:T.font, margin:"0 0 4px" }}>Module B — Kennis & Ervaring</h3>
      <p style={{ fontSize:12, color:T.textSec, fontFamily:T.font, marginBottom:22 }}>Bepaal het deskundigheidsniveau van de werkgever. Stuurt de diepgang van de rapportage.</p>

      {groepen.map(gr => (
        <div key={gr} style={{ marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:600, color:T.textTer, margin:"0 0 10px", fontFamily:T.font, textTransform:"uppercase", letterSpacing:".05em" }}>{gr}</p>
          {vragen.filter(v => v.groep===gr).map(v => (
            <div key={v.id} style={{ background:T.bgCard, border:`0.5px solid ${data[v.id] ? T.accent+"33" : T.border}`, borderRadius:9, padding:"12px 14px", marginBottom:8 }}>
              <div style={{ fontSize:12, color:T.text, fontFamily:T.font, marginBottom:10, lineHeight:1.5 }}>{v.vraag}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {v.opties.map(opt => {
                  const sel = data[v.id]===opt;
                  return <button key={opt} onClick={() => set(v.id,opt)} style={{ padding:"5px 12px", borderRadius:99, fontSize:12, border:`1px solid ${sel?T.accent:T.border}`, background:sel?T.accent:T.bgSec, color:sel?"#fff":T.textSec, cursor:"pointer", fontFamily:T.font }}>{opt}</button>;
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {antwoorden >= 3 && (
        <div style={{ background:niveau.bg, border:`0.5px solid ${niveau.kleur}44`, borderRadius:9, padding:"10px 14px" }}>
          <div style={{ fontSize:12, fontWeight:600, color:niveau.kleur, fontFamily:T.font }}>
            Kennisniveau: <strong>{niveau.label}</strong> ({sc}/{vragen.length} indicatoren positief)
          </div>
          <div style={{ fontSize:11, color:niveau.kleur, marginTop:2, fontFamily:T.font }}>
            {niveau.label==="Basis"?"Rapport bevat meer uitleg en achtergrond":niveau.label==="Gemiddeld"?"Rapport bevat standaard toelichting":"Rapport kan beknopter; werkgever is goed geïnformeerd"}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleC({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const premie = data.premiePerc || 20;
  return (
    <div>
      <h3 style={{ fontSize:15, fontWeight:600, color:T.text, fontFamily:T.font, margin:"0 0 4px" }}>Module C — Doelstellingen & Risicobereidheid</h3>
      <p style={{ fontSize:12, color:T.textSec, fontFamily:T.font, marginBottom:22 }}>Wat wil de werkgever regelen voor het personeel?</p>

      <Lbl>Hoogte vlakke premie (% van pensioengrondslag)</Lbl>
      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:9, padding:"16px 16px 12px", marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>15%</span>
          <span style={{ fontSize:22, fontWeight:600, color:T.accent, fontFamily:T.font }}>{premie}%</span>
          <span style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>30%</span>
        </div>
        <input type="range" min={15} max={30} step={0.5} value={premie} onChange={e => set("premiePerc",parseFloat(e.target.value))} style={{ width:"100%", accentColor:T.accent }} />
        <div style={{ fontSize:11, color:T.textTer, marginTop:6, fontFamily:T.font }}>
          {premie<18?"Sober – minimale premie":premie<23?"Gemiddeld – marktconform":"Royaal – ruime dekking"}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
        <div><Lbl>Nabestaandenpensioen</Lbl><Toggle opties={["Ja","Nee"]} value={data.nabestaanden} onChange={v=>set("nabestaanden",v)} /></div>
        <div><Lbl>ANW-hiaat aanvulling</Lbl><Toggle opties={["Ja","Nee"]} value={data.anwHiaat} onChange={v=>set("anwHiaat",v)} /></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
        <div><Lbl>Compensatiebereidheid</Lbl><Toggle opties={["Ja","Beperkt","Nee"]} value={data.compensatie} onChange={v=>set("compensatie",v)} /></div>
        <div><Lbl>Gewenste pensioenleeftijd</Lbl><Toggle opties={["67","68","Flexibel"]} value={data.pensioenLeeftijd} onChange={v=>set("pensioenLeeftijd",v)} /></div>
      </div>

      <Lbl>Risicobereidheid beleggingen</Lbl>
      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        {[{id:"defensief",label:"Defensief",desc:"Veiligheid voorop"},{id:"neutraal",label:"Neutraal",desc:"Gebalanceerd"},{id:"offensief",label:"Offensief",desc:"Hogere groei"}].map(r => {
          const sel = data.risico===r.id;
          return (
            <div key={r.id} onClick={() => set("risico",r.id)} style={{ flex:1, padding:"10px 12px", borderRadius:9, border:`1px solid ${sel?T.accent:T.border}`, background:sel?"#e0f2ee":T.bgSec, cursor:"pointer" }}>
              <div style={{ fontSize:12, fontWeight:500, color:sel?T.accent:T.text, fontFamily:T.font }}>{r.label}</div>
              <div style={{ fontSize:10, color:T.textTer, fontFamily:T.font, marginTop:2 }}>{r.desc}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div><Lbl>Hoog/laag-uitkering voorkeur</Lbl><Toggle opties={["Hoog-laag","Vlak","Geen voorkeur"]} value={data.hoogLaag} onChange={v=>set("hoogLaag",v)} /></div>
        <div><Lbl>Deeltijdpensioen mogelijk</Lbl><Toggle opties={["Ja","Nee"]} value={data.deeltijd} onChange={v=>set("deeltijd",v)} /></div>
      </div>
    </div>
  );
}

function ModuleD({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const CAO_OPTIES = ["Metaal en Techniek","Bouw","Detailhandel","Horeca","Zorg en Welzijn","Transport","ICT","Overheid","Geen van toepassing","Anders"];
  const BPF_MAP = { "Metaal en Techniek":"PMT","Bouw":"BPF Bouw","Zorg en Welzijn":"PFZW" };
  const bpfCao = data.cao && BPF_MAP[data.cao];
  const bpfHandmatig = data.bpfHandmatig === "Ja";

  return (
    <div>
      <h3 style={{ fontSize:15, fontWeight:600, color:T.text, fontFamily:T.font, margin:"0 0 4px" }}>Module D — Kader & Verplichtingen</h3>
      <p style={{ fontSize:12, color:T.textSec, fontFamily:T.font, marginBottom:22 }}>Check of er externe beperkingen zijn die het adviestraject beïnvloeden.</p>

      <Lbl>CAO van toepassing</Lbl>
      <select value={data.cao||""} onChange={e=>set("cao",e.target.value)} style={{ width:"100%", padding:"9px 11px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.bgCard, outline:"none", marginBottom:18 }}>
        <option value="">— Selecteer CAO —</option>
        {CAO_OPTIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {(bpfCao || bpfHandmatig) && (
        <div style={{ background:"#fcebeb", border:"0.5px solid #e24b4a44", borderRadius:9, padding:"12px 14px", marginBottom:18 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#a32d2d", fontFamily:T.font, marginBottom:4 }}>⛔ BPF-verplichting gedetecteerd</div>
          <div style={{ fontSize:12, color:"#a32d2d", fontFamily:T.font }}>
            Deze werkgever valt onder verplicht Bedrijfstakpensioenfonds{bpfCao ? ` ${bpfCao}` : ""}. Een individuele pensioenregeling is niet mogelijk. Het adviestraject wordt geblokkeerd.
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
        <div>
          <Lbl>SBI-code (voor BPF-validatie)</Lbl>
          <Inp value={data.sbi||""} placeholder="bv. 2562" onChange={v=>set("sbi",v)} />
        </div>
        <div>
          <Lbl>BPF-verplichting (handmatig)</Lbl>
          <Toggle opties={["Ja","Nee","Onbekend"]} value={data.bpfHandmatig} onChange={v=>set("bpfHandmatig",v)} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }}>
        <div>
          <Lbl>OR / PVT aanwezig</Lbl>
          <Toggle opties={["Ja","Nee"]} value={data.or} onChange={v=>set("or",v)} />
          {data.or==="Ja" && <div style={{ fontSize:11, color:"#854f0b", marginTop:6, fontFamily:T.font }}>ℹ Instemmingstraject OR vereist (WOR art. 27)</div>}
        </div>
        <div>
          <Lbl>CAO vrije invoer / opmerking</Lbl>
          <Inp value={data.caoVrij||""} placeholder="Naam cao of opmerking" onChange={v=>set("caoVrij",v)} />
        </div>
      </div>
    </div>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────
const MODS = [
  { id:"A", naam:"Financiële Positie" },
  { id:"B", naam:"Kennis & Ervaring" },
  { id:"C", naam:"Doelstellingen & Risico" },
  { id:"D", naam:"Kader & Verplichtingen" },
];

function WizardSteps({ stap, onGo }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", marginBottom:28 }}>
      {MODS.map((m, i) => {
        const klaar = i < stap, actief = i === stap;
        return (
          <div key={m.id} style={{ display:"flex", alignItems:"flex-start", flex:1 }}>
            <div onClick={() => klaar && onGo(i)} style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1, cursor:klaar?"pointer":"default" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, fontFamily:T.font, marginBottom:5, background:klaar?T.accent:actief?T.accent:T.bgSec, color:(klaar||actief)?"#fff":T.textTer, boxShadow:actief?`0 0 0 4px ${T.accent}22`:"none" }}>
                {klaar ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : m.id}
              </div>
              <div style={{ fontSize:10, color:actief?T.accent:klaar?T.text:T.textTer, fontFamily:T.font, fontWeight:actief?600:400, textAlign:"center", maxWidth:80 }}>{m.naam}</div>
            </div>
            {i < MODS.length - 1 && (
              <div style={{ height:1, flex:"0 0 20px", background:klaar?T.accent:T.border, marginTop:14 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Inventarisatie({ klant, onTerug, onAfronden }) {
  const [stap, setStap] = useState(0);
  const [dataA, setDataA] = useState({});
  const [dataB, setDataB] = useState({});
  const [dataC, setDataC] = useState({ premiePerc:20 });
  const [dataD, setDataD] = useState({});
  const [opgeslagen, setOpgeslagen] = useState(false);

  const bpfBlok = dataD.bpfHandmatig==="Ja" || (dataD.cao && ["Metaal en Techniek","Bouw","Zorg en Welzijn"].includes(dataD.cao));
  const kanVolgende = [
    () => (dataA.omzetJaren||[]).some(j=>j.waarde) || dataA.loonsom,
    () => Object.keys(dataB).length >= 3,
    () => !!dataC.risico,
    () => !!dataD.cao,
  ][stap];

  const slaOp = () => {
    setOpgeslagen(true);
    setTimeout(() => onAfronden({ moduleA:dataA, moduleB:dataB, moduleC:dataC, moduleD:dataD }), 900);
  };

  return (
    <div style={{ maxWidth:700, margin:"0 auto", padding:"28px 24px" }}>
      {/* Breadcrumb */}
      <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textTer, fontFamily:T.font, marginBottom:20, flexWrap:"wrap" }}>
        <button onClick={onTerug} style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:T.textTer, fontFamily:T.font, fontSize:12 }}>Alle klanten</button>
        <span>/</span>
        <button onClick={onTerug} style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:T.textTer, fontFamily:T.font, fontSize:12 }}>{klant.naam}</button>
        <span>/</span>
        <span style={{ color:T.text, fontWeight:500 }}>Adviestraject</span>
        <span>/</span>
        <span style={{ color:T.accent, fontWeight:500 }}>Inventarisatie</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <div style={{ fontSize:11, fontWeight:600, color:T.textTer, fontFamily:T.font, textTransform:"uppercase", letterSpacing:".05em", background:T.bgSec, padding:"3px 8px", borderRadius:5 }}>Stap 1 van 3</div>
          <div style={{ fontSize:11, color:T.textTer, fontFamily:T.font }}>Inventarisatie · Analyse · Adviesrapport</div>
        </div>
        <h2 style={{ margin:0, fontSize:20, fontWeight:600, color:T.text, fontFamily:T.font }}>Wft Klantprofiel</h2>
        <p style={{ margin:"4px 0 0", fontSize:12, color:T.textSec, fontFamily:T.font }}>Wettelijke basis: Wft art. 4:23 — zonder inventarisatie geen geldig advies</p>
      </div>

      <WizardSteps stap={stap} onGo={setStap} />

      <div style={{ background:T.bgCard, border:`0.5px solid ${T.border}`, borderRadius:12, padding:"22px 24px", marginBottom:18 }}>
        {stap===0 && <ModuleA data={dataA} onChange={setDataA} />}
        {stap===1 && <ModuleB data={dataB} onChange={setDataB} />}
        {stap===2 && <ModuleC data={dataC} onChange={setDataC} />}
        {stap===3 && <ModuleD data={dataD} onChange={setDataD} />}
      </div>

      {stap===3 && bpfBlok && (
        <div style={{ background:"#fcebeb", border:"0.5px solid #e24b4a66", borderRadius:10, padding:"12px 16px", marginBottom:14, display:"flex", gap:10 }}>
          <span style={{ fontSize:16 }}>⛔</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#a32d2d", fontFamily:T.font, marginBottom:2 }}>Adviestraject geblokkeerd</div>
            <div style={{ fontSize:12, color:"#a32d2d", fontFamily:T.font }}>Door BPF-verplichting kan geen individuele regeling worden geadviseerd. Bespreek dit met de werkgever en sluit het dossier af.</div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <button onClick={() => stap>0 ? setStap(stap-1) : onTerug()} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:13, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>
          {stap===0 ? "Annuleren" : "← Vorige"}
        </button>
        {stap < 3 ? (
          <button onClick={() => kanVolgende() && setStap(stap+1)} style={{ padding:"8px 20px", borderRadius:8, border:"none", background:kanVolgende()?T.accent:"#b2d8cd", color:"#fff", fontSize:13, fontWeight:500, cursor:kanVolgende()?"pointer":"not-allowed", fontFamily:T.font }}>
            Volgende →
          </button>
        ) : (
          <button onClick={() => !bpfBlok && !opgeslagen && slaOp()} disabled={bpfBlok||opgeslagen} style={{ padding:"8px 22px", borderRadius:8, border:"none", background:bpfBlok?"#e2e0d9":T.accent, color:"#fff", fontSize:13, fontWeight:500, cursor:bpfBlok?"not-allowed":"pointer", fontFamily:T.font }}>
            {opgeslagen ? "✓ Opgeslagen!" : "Klantprofiel opslaan"}
          </button>
        )}
      </div>
    </div>
  );
}

function InventarisatieKlaar({ klant, onTerug }) {
  return (
    <div style={{ maxWidth:500, margin:"60px auto", padding:"0 24px", textAlign:"center" }}>
      <div style={{ width:56, height:56, borderRadius:"50%", background:"#e0f2ee", border:`2px solid ${T.accent}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:26 }}>✓</div>
      <h2 style={{ fontSize:20, fontWeight:600, color:T.text, fontFamily:T.font, marginBottom:8 }}>Inventarisatie voltooid</h2>
      <p style={{ fontSize:13, color:T.textSec, fontFamily:T.font, marginBottom:28 }}>Het Wft klantprofiel voor <strong>{klant.naam}</strong> is opgeslagen in het dossier. Volgende stap: Analyse.</p>
      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
        <button onClick={onTerug} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bgSec, fontSize:13, cursor:"pointer", fontFamily:T.font, color:T.textSec }}>Terug naar klant</button>
        <button style={{ padding:"8px 18px", borderRadius:8, border:"none", background:T.accent, color:"#fff", fontSize:13, fontWeight:500, fontFamily:T.font, opacity:0.5, cursor:"not-allowed" }}>Naar analyse → (binnenkort)</button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [scherm, setScherm] = useState("dashboard");
  const [klanten, setKlanten] = useState(MOCK_KLANTEN_INIT);
  const [actieveKlant, setActieveKlant] = useState(null);

  if (typeof document !== "undefined" && !document.getElementById("af-font")) {
    const link = document.createElement("link");
    link.id = "af-font"; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
  }

  const openKlant = (k) => { setActieveKlant(k); setScherm("klant"); };
  const voegToe = (f) => setKlanten(p => [{ id:String(Date.now()), naam:f.naam, kvk:f.kvk, contact:f.contact, email:f.email, tel:f.tel, stad:f.stad, status:"Nieuw", fase:null, progress:0 }, ...p]);
  const afronden = () => {
    setKlanten(p => p.map(k => k.id===actieveKlant.id ? { ...k, status:"Adviestraject", fase:"Inventarisatie", progress:35 } : k));
    setScherm("klaar");
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:T.font }}>
      <Nav onHome={() => { setScherm("dashboard"); setActieveKlant(null); }} />
      {scherm==="dashboard" && <Dashboard klanten={klanten} onNieuw={voegToe} onKlant={openKlant} />}
      {scherm==="klant" && actieveKlant && <KlantPagina klant={actieveKlant} onTerug={() => { setScherm("dashboard"); setActieveKlant(null); }} onStartAdvies={() => setScherm("inventarisatie")} />}
      {scherm==="inventarisatie" && actieveKlant && <Inventarisatie klant={actieveKlant} onTerug={() => setScherm("klant")} onAfronden={afronden} />}
      {scherm==="klaar" && actieveKlant && <InventarisatieKlaar klant={actieveKlant} onTerug={() => setScherm("klant")} />}
    </div>
  );
}
