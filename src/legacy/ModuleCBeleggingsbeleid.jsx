import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, LineChart, Line, Area, AreaChart, Legend
} from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#f7f6f3", bgCard: "#ffffff", bgSec: "#f1efe8",
  border: "rgba(15,15,14,0.10)", borderSec: "rgba(15,15,14,0.06)",
  text: "#0f0f0e", textSec: "rgba(15,15,14,0.55)", textTer: "rgba(15,15,14,0.38)",
  accent: "#1d9e75", accentBg: "#e0f2ee",
  warn: "#ef9f27", warnBg: "#faeeda", warnText: "#854f0b",
  danger: "#e24b4a", dangerBg: "#fcebeb", dangerText: "#a32d2d",
  blue: "#185fa5", blueBg: "#e6f1fb",
  purple: "#5b4fcf", purpleBg: "#edeaf8",
  aow: "#94a3b8",    // AOW laag kleur
  font: "'DM Sans', system-ui, sans-serif",
  mono: "'DM Mono', monospace",
};

// ─── Lifecycle-profielen per aanbieder ────────────────────────────────────────
// equity% per leeftijd (zakelijke waarden, rest is obligaties/vastrentend)
const LIFECYCLES = {
  "Nationale-Nederlanden": [
    {age:25,equity:85},{age:30,equity:85},{age:35,equity:80},{age:40,equity:75},
    {age:45,equity:65},{age:50,equity:52},{age:55,equity:38},{age:60,equity:22},{age:65,equity:10},{age:67,equity:5},
  ],
  "ASR": [
    {age:25,equity:90},{age:30,equity:88},{age:35,equity:82},{age:40,equity:72},
    {age:45,equity:58},{age:50,equity:44},{age:55,equity:30},{age:60,equity:18},{age:65,equity:8},{age:67,equity:4},
  ],
  "Aegon": [
    {age:25,equity:80},{age:30,equity:80},{age:35,equity:76},{age:40,equity:70},
    {age:45,equity:60},{age:50,equity:48},{age:55,equity:35},{age:60,equity:20},{age:65,equity:10},{age:67,equity:5},
  ],
  "Centraal Beheer": [
    {age:25,equity:75},{age:30,equity:75},{age:35,equity:70},{age:40,equity:62},
    {age:45,equity:52},{age:50,equity:40},{age:55,equity:28},{age:60,equity:16},{age:65,equity:8},{age:67,equity:4},
  ],
  "BrandNewDay": [
    {age:25,equity:100},{age:30,equity:100},{age:35,equity:90},{age:40,equity:78},
    {age:45,equity:64},{age:50,equity:50},{age:55,equity:36},{age:60,equity:22},{age:65,equity:10},{age:67,equity:5},
  ],
};
const DEFAULT_LIFECYCLE = LIFECYCLES["Nationale-Nederlanden"];

// AOW-bedragen per leeftijdscategorie (bruto maandbedrag, alleenstaand)
const AOW_MAAND = 1400; // Standaard inschatting

// URM-rendementscenario's (jaarlijks rendement)
const URM_SCENARIOS = {
  pessimistisch: 0.01,
  verwacht:      0.04,
  optimistisch:  0.07,
};
const INFLATIE = 0.02;

// ─── Rekenkern ────────────────────────────────────────────────────────────────
function berekenEquityOpLeeftijd(leeftijd, lifecycle) {
  const sorted = [...lifecycle].sort((a, b) => a.age - b.age);
  // Interpoleer
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (leeftijd >= a.age && leeftijd <= b.age) {
      const t = (leeftijd - a.age) / (b.age - a.age);
      return Math.round(a.equity + t * (b.equity - a.equity));
    }
  }
  if (leeftijd <= sorted[0].age) return sorted[0].equity;
  return sorted[sorted.length - 1].equity;
}

// URM: eindkapitaal → maandelijkse uitkering (annuïteit 20 jaar na AOW)
function kapitaalNaarMaand(kapitaal) {
  const r = 0.02 / 12; // conservatief uitkeringsrendement
  const n = 20 * 12;   // 20 jaar uitkering
  if (r === 0) return kapitaal / n;
  return kapitaal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function berekenURM(params) {
  const { leeftijd, salaris, franchise, premiePerc, extraInlegPerc = 0, koopkrachtCorrectie = false } = params;
  const AOW_LEEFTIJD = 67;
  const restJaren = Math.max(0, AOW_LEEFTIJD - leeftijd);
  const grondslag = Math.max(0, salaris - franchise);
  const jaarInleg = grondslag * (premiePerc / 100);
  const extraInleg = grondslag * (extraInlegPerc / 100);
  const totaalInleg = jaarInleg + extraInleg;

  const result = {};
  Object.entries(URM_SCENARIOS).forEach(([naam, r]) => {
    const fv = restJaren > 0 ? ((Math.pow(1 + r, restJaren) - 1) / r) * (1 + r) : 1;
    let kapitaal = totaalInleg * fv;

    // Koopkrachtcorrectie op eindkapitaal
    if (koopkrachtCorrectie) {
      const inflatieCorrectie = Math.pow(1 + INFLATIE, restJaren);
      kapitaal = kapitaal / inflatieCorrectie;
    }
    result[naam] = Math.max(0, kapitaalNaarMaand(kapitaal));
  });
  return result;
}

// ─── Demo-werknemer (simuleer context vanuit module A) ─────────────────────
const DEMO = {
  naam: "H. van Dijk",
  leeftijd: 48,
  salaris: 62000,
  franchise: 17545,
  premiePerc: 20,
  aanbieder: "Nationale-Nederlanden",
  risicoProfiel: "neutraal", // uit inventarisatie module C
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const eur = (n) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);
function eurCompact(n) {
  const v = n ?? 0;
  if (v >= 1_000_000) return `€\u00a0${(v / 1_000_000).toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}\u00a0mln`;
  if (v >= 1_000) return `€\u00a0${(v / 1_000).toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}\u00a0k`;
  return eur(v);
}

function Toggle({ aan, onChange, label }) {
  return (
    <button onClick={() => onChange(!aan)}
      style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
      <div style={{
        width: 36, height: 20, borderRadius: 99, background: aan ? T.accent : T.border,
        position: "relative", transition: "background .2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: aan ? 18 : 2, width: 16, height: 16,
          borderRadius: "50%", background: "#fff", transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }} />
      </div>
      <span style={{ fontSize: 12, color: aan ? T.text : T.textSec, fontFamily: T.font, fontWeight: aan ? 500 : 400 }}>{label}</span>
    </button>
  );
}

function SectionCard({ title, sub, children, accent }) {
  return (
    <div style={{ background: T.bgCard, border: `0.5px solid ${accent || T.border}`, borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
      <div style={{ padding: "13px 16px", borderBottom: `0.5px solid ${T.borderSec}`, background: accent ? `${accent}08` : T.bgSec }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2, fontFamily: T.font }}>{sub}</div>}
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

// ─── 1. Lifecycle Visualisatie ────────────────────────────────────────────────
function LifecycleVergelijking({ geselecteerd, onSelect }) {
  const leeftijden = [25, 30, 35, 40, 45, 50, 55, 60, 65, 67];
  const kleuren = {
    "Nationale-Nederlanden": T.accent,
    "ASR": T.blue,
    "Aegon": T.warn,
    "Centraal Beheer": T.purple,
    "BrandNewDay": T.danger,
  };

  // Grafiekdata
  const data = leeftijden.map(age => {
    const row = { age: `${age}` };
    Object.entries(LIFECYCLES).forEach(([naam, lc]) => {
      row[naam] = berekenEquityOpLeeftijd(age, lc);
    });
    return row;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 11, fontFamily: T.font, boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: T.text }}>Leeftijd {label} jaar</div>
        {payload.sort((a, b) => b.value - a.value).map(p => (
          <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <span style={{ color: T.textSec, flex: 1 }}>{p.name}</span>
            <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.text }}>{p.value}%</span>
          </div>
        ))}
        <div style={{ marginTop: 6, paddingTop: 5, borderTop: `0.5px solid ${T.borderSec}`, fontSize: 10, color: T.textTer }}>
          Rest = obligaties / vastrentend
        </div>
      </div>
    );
  };

  return (
    <SectionCard title="Lifecycle-vergelijking: zakelijke waarden % per leeftijd"
      sub="Hoger = meer risico en groeipotentieel. Lifecycle bouwt automatisch af richting pensioendatum.">
      {/* Aanbieder toggles */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {Object.keys(LIFECYCLES).map(naam => {
          const sel = geselecteerd.includes(naam);
          const kleur = kleuren[naam];
          return (
            <button key={naam} onClick={() => onSelect(naam)}
              style={{ padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 500,
                border: `1px solid ${sel ? kleur : T.border}`,
                background: sel ? kleur : T.bgSec,
                color: sel ? "#fff" : T.textSec,
                cursor: "pointer", fontFamily: T.font, transition: "all .12s" }}>
              {naam}
            </button>
          );
        })}
      </div>

      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <XAxis dataKey="age" tick={{ fontSize: 11, fontFamily: T.font, fill: T.textTer }}
              axisLine={false} tickLine={false} label={{ value: "Leeftijd", position: "insideBottom", offset: -2, fontSize: 10, fill: T.textTer }} />
            <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textTer }}
              axisLine={false} tickLine={false} domain={[0, 100]} width={36} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke={T.borderSec} strokeDasharray="4 4" />
            {geselecteerd.map(naam => (
              <Line key={naam} type="monotone" dataKey={naam} stroke={kleuren[naam]}
                strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 10, padding: "8px 12px", background: T.bgSec, borderRadius: 8, fontSize: 11, color: T.textSec, fontFamily: T.font }}>
        <strong style={{ color: T.text }}>Risicomapping:</strong> Werkgeversprofiel uit inventarisatie is{" "}
        <span style={{ fontWeight: 600, color: T.accent }}>Neutraal</span>. BrandNewDay (100% equity jong) past minder goed bij dit profiel dan Centraal Beheer (defensiever).
      </div>
    </SectionCard>
  );
}

// ─── 4. Lifecycle Tijdlijn (per werknemer) ───────────────────────────────────
function LifecycleTijdlijn({ leeftijd, aanbieder }) {
  const lifecycle = LIFECYCLES[aanbieder] || DEFAULT_LIFECYCLE;
  const equity = berekenEquityOpLeeftijd(leeftijd, lifecycle);
  const vastrentend = 100 - equity;

  const risicoLabel = equity >= 70 ? { text: "Hoog risico", kleur: T.danger, bg: T.dangerBg }
    : equity >= 40 ? { text: "Gemiddeld risico", kleur: T.warn, bg: T.warnBg }
    : { text: "Laag risico", kleur: T.accent, bg: T.accentBg };

  const uitleg = equity >= 70
    ? `Het pensioengeld van ${DEMO.naam} is voor ${equity}% belegd in zakelijke waarden. Bij een beurscrash kan dit tijdelijk flink dalen, maar er is nog voldoende hersteltijd voor pensioendatum.`
    : equity >= 40
    ? `Het pensioengeld is voor ${equity}% in zakelijke waarden. Een gebalanceerde mix — bij een beurscrisis is de klap beperkt doordat ${vastrentend}% vastrentend is.`
    : `Het pensioengeld is voor ${vastrentend}% veiliggesteld in vastrentende waarden. Een beurscrisis raakt dit pensioen nu beperkt. Minder groeipotentieel, maar stabiel.`;

  const jaren = [25, 30, 35, 40, 45, 50, 55, 60, 65, 67];

  return (
    <SectionCard title="Lifecycle Risico-Tijdlijn" sub={`Actuele positie van ${DEMO.naam} (${leeftijd} jaar) in de lifecycle van ${aanbieder}`} accent={risicoLabel.kleur}>
      {/* Tijdlijn balk */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        {/* Achtergrond gradient */}
        <div style={{ height: 14, borderRadius: 99, background: `linear-gradient(to right, ${T.danger}, ${T.warn}, ${T.accent})`, position: "relative", opacity: 0.15 }} />
        {/* Equity balk */}
        <div style={{ position: "absolute", top: 0, left: 0, height: 14, width: `${equity}%`, borderRadius: 99,
          background: `linear-gradient(to right, ${equity >= 70 ? T.danger : equity >= 40 ? T.warn : T.accent}, ${equity >= 70 ? T.warn : T.accent})`,
          transition: "width .4s" }} />
        {/* Markering huidige leeftijd */}
        <div style={{ position: "absolute", top: -4, left: `${((leeftijd - 25) / (67 - 25)) * 100}%`, transform: "translateX(-50%)" }}>
          <div style={{ width: 18, height: 22, background: T.text, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 8, color: "#fff", fontFamily: T.mono, fontWeight: 700 }}>{leeftijd}</span>
          </div>
        </div>
        {/* Labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {[25, 35, 45, 55, 67].map(l => (
            <span key={l} style={{ fontSize: 9, color: T.textTer, fontFamily: T.mono }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: risicoLabel.bg, border: `0.5px solid ${risicoLabel.kleur}44`, borderRadius: 9, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: risicoLabel.kleur, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2, fontFamily: T.font }}>Zakelijke waarden</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: risicoLabel.kleur, fontFamily: T.mono, lineHeight: 1 }}>{equity}%</div>
          <div style={{ fontSize: 10, color: risicoLabel.kleur, marginTop: 2, fontFamily: T.font }}>{risicoLabel.text}</div>
        </div>
        <div style={{ background: T.accentBg, border: `0.5px solid ${T.accent}44`, borderRadius: 9, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: T.accent, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2, fontFamily: T.font }}>Vastrentend</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.accent, fontFamily: T.mono, lineHeight: 1 }}>{vastrentend}%</div>
          <div style={{ fontSize: 10, color: T.accent, marginTop: 2, fontFamily: T.font }}>Beschermd kapitaal</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, lineHeight: 1.6, padding: "9px 12px", background: T.bgSec, borderRadius: 8 }}>
        {uitleg}
      </div>
    </SectionCard>
  );
}

// ─── 2+3. URM Projecties + AOW-stacking + Koopkracht + Repareer-slider ───────
function URMModule({ params, aanbieder }) {
  const [koopkracht, setKoopkracht] = useState(false);
  const [extraInleg, setExtraInleg] = useState(0);
  const [doelstelling, setDoelstelling] = useState(70); // % van huidig salaris

  const urm = useMemo(() =>
    berekenURM({ ...params, extraInlegPerc: extraInleg, koopkrachtCorrectie: koopkracht }),
    [params, extraInleg, koopkracht]
  );

  // Doelstelling in €/maand
  const doelMaand = (params.salaris / 12) * (doelstelling / 100);

  // Grafiekdata: AOW + URM gestapeld
  const grafiekData = [
    {
      scenario: "Pessimistisch",
      kleur: T.danger,
      aow: AOW_MAAND,
      pensioen: urm.pessimistisch,
      totaal: AOW_MAAND + urm.pessimistisch,
    },
    {
      scenario: "Verwacht",
      kleur: T.warn,
      aow: AOW_MAAND,
      pensioen: urm.verwacht,
      totaal: AOW_MAAND + urm.verwacht,
    },
    {
      scenario: "Optimistisch",
      kleur: T.accent,
      aow: AOW_MAAND,
      pensioen: urm.optimistisch,
      totaal: AOW_MAAND + urm.optimistisch,
    },
  ];

  const pessimistischTekort = grafiekData[0].totaal < doelMaand;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = grafiekData.find(g => g.scenario === label);
    return (
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 9, padding: "12px 16px", fontSize: 12, fontFamily: T.font, boxShadow: "0 4px 16px rgba(0,0,0,.1)", minWidth: 180 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: T.text }}>{label} scenario</div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: T.aow }}>AOW</span>
          <span style={{ fontFamily: T.mono, fontWeight: 600 }}>{eur(AOW_MAAND)}/mnd</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: d?.kleur }}>2e pijler</span>
          <span style={{ fontFamily: T.mono, fontWeight: 600 }}>{eur(d?.pensioen)}/mnd</span>
        </div>
        <div style={{ borderTop: `1px solid ${T.borderSec}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, color: T.text }}>Totaal</span>
          <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.text }}>{eur(d?.totaal)}/mnd</span>
        </div>
        {doelMaand > 0 && (
          <div style={{ marginTop: 4, fontSize: 10, color: d?.totaal >= doelMaand ? T.accent : T.danger }}>
            {d?.totaal >= doelMaand ? `✓ Boven doelstelling (${eur(doelMaand)}/mnd)` : `▼ ${eur(doelMaand - d?.totaal)}/mnd onder doelstelling`}
          </div>
        )}
      </div>
    );
  };

  return (
    <SectionCard
      title="URM-Projecties — Verwacht pensioen per maand"
      sub={`${params.naam} · ${params.leeftijd} jaar · premie ${params.premiePerc}% · aanbieder: ${aanbieder}`}>

      {/* Controls */}
      <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Toggle aan={koopkracht} onChange={setKoopkracht} label="Koopkrachtcorrectie (2% inflatie)" />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.font }}>Doelstelling:</span>
          <input type="number" value={doelstelling} onChange={e => setDoelstelling(+e.target.value)} min={40} max={100} step={5}
            style={{ width: 52, padding: "4px 7px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.mono, color: T.text, background: T.bgSec, outline: "none", textAlign: "center" }} />
          <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.font }}>% van huidig salaris = <strong style={{ fontFamily: T.mono, color: T.text }}>{eur(doelMaand)}/mnd</strong></span>
        </div>
      </div>

      {koopkracht && (
        <div style={{ background: T.blueBg, border: `0.5px solid ${T.blue}44`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 11, color: T.blue, fontFamily: T.font }}>
          💡 <strong>Koopkrachtcorrectie aan:</strong> Bedragen zijn gecorrigeerd voor 2% verwachte inflatie over {67 - params.leeftijd} jaar. Dit geeft een eerlijker vergelijking met de reële waarde van de huidige regeling.
        </div>
      )}

      {/* Gestapelde bar chart */}
      <div style={{ height: 240, marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={grafiekData} margin={{ top: 16, right: 16, bottom: 0, left: 20 }} barSize={64}>
            <XAxis dataKey="scenario" tick={{ fontSize: 12, fontFamily: T.font, fill: T.text }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `€${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: T.mono, fill: T.textTer }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<CustomTooltip />} />
            {/* Doelstellingslijn */}
            {doelMaand > 0 && (
              <ReferenceLine y={doelMaand} stroke={T.blue} strokeDasharray="6 3" strokeWidth={1.5}
                label={{ value: "Doel", position: "right", fontSize: 10, fill: T.blue, fontFamily: T.font }} />
            )}
            {/* AOW laag (onderste) */}
            <Bar dataKey="aow" stackId="a" name="AOW" fill={T.aow} radius={[0, 0, 0, 0]}>
              {grafiekData.map((_, i) => <Cell key={i} fill={T.aow} fillOpacity={0.7} />)}
            </Bar>
            {/* 2e pijler (bovenste) */}
            <Bar dataKey="pensioen" stackId="a" name="2e pijler" radius={[5, 5, 0, 0]}>
              {grafiekData.map((g, i) => <Cell key={i} fill={g.kleur} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        {[{ kleur: T.aow, label: `AOW (${eur(AOW_MAAND)}/mnd)` }, { kleur: T.danger, label: "Pessimistisch (1%)" }, { kleur: T.warn, label: "Verwacht (4%)" }, { kleur: T.accent, label: "Optimistisch (7%)" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.kleur, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.font }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Repareer-slider */}
      {pessimistischTekort && (
        <div style={{ background: T.dangerBg, border: `1px solid ${T.danger}44`, borderRadius: 10, padding: "14px 16px", marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.dangerText, fontFamily: T.font, marginBottom: 4 }}>
            ⚠ Pessimistisch scenario ({eur(grafiekData[0].totaal)}/mnd) ligt onder de doelstelling ({eur(doelMaand)}/mnd)
          </div>
          <div style={{ fontSize: 12, color: T.dangerText, fontFamily: T.font, marginBottom: 14 }}>
            De werknemer kan het verschil (deels) repareren door extra bij te storten. Sleep de slider om te zien wat dit oplevert:
          </div>

          {/* Slider */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: T.dangerText, fontFamily: T.font }}>Extra inleg werkgever / werknemer</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: T.dangerText, fontFamily: T.mono }}>{extraInleg.toFixed(1)}%</span>
            </div>
            <input type="range" min={0} max={8} step={0.5} value={extraInleg}
              onChange={e => setExtraInleg(+e.target.value)}
              style={{ width: "100%", accentColor: T.danger }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.dangerText, fontFamily: T.font, marginTop: 2 }}>
              <span>+0% (geen extra)</span><span>+4%</span><span>+8% (max)</span>
            </div>
          </div>

          {/* Live effect */}
          {extraInleg > 0 && (() => {
            const nieuwPess = berekenURM({ ...params, extraInlegPerc: extraInleg, koopkrachtCorrectie: koopkracht }).pessimistisch;
            const nieuwTotaal = AOW_MAAND + nieuwPess;
            const gedicht = nieuwTotaal >= doelMaand;
            return (
              <div style={{ background: gedicht ? T.accentBg : T.warnBg, border: `0.5px solid ${gedicht ? T.accent : T.warn}44`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: gedicht ? T.accent : T.warnText, fontFamily: T.font }}>
                    {gedicht ? "✓ Doelstelling gehaald!" : "Nog niet voldoende"}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: T.mono, color: gedicht ? T.accent : T.warnText }}>
                    {eur(nieuwTotaal)}/mnd
                  </span>
                </div>
                <div style={{ fontSize: 11, color: gedicht ? T.accent : T.warnText, fontFamily: T.font }}>
                  {gedicht
                    ? `Met +${extraInleg}% extra inleg is het pessimistische scenario (${eur(nieuwTotaal)}/mnd) boven de doelstelling.`
                    : `Nog ${eur(doelMaand - nieuwTotaal)}/mnd tekort. Probeer een hogere extra inleg.`}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {!pessimistischTekort && (
        <div style={{ background: T.accentBg, border: `0.5px solid ${T.accent}44`, borderRadius: 9, padding: "9px 12px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <span style={{ fontSize: 12, color: T.accent, fontFamily: T.font }}>
            Zelfs het pessimistische scenario ({eur(grafiekData[0].totaal)}/mnd) ligt boven de doelstelling. Geen aanvullende actie nodig.
          </span>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Aanbieder selector ───────────────────────────────────────────────────────
function AanbiederSelector({ value, onChange }) {
  return (
    <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: T.textSec, fontFamily: T.font, whiteSpace: "nowrap" }}>Geselecteerde aanbieder</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.text, background: T.bgSec, outline: "none" }}>
        {Object.keys(LIFECYCLES).map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <div style={{ fontSize: 11, color: T.textTer, fontFamily: T.font, whiteSpace: "nowrap" }}>
        Overgenomen uit Module 2.2
      </div>
    </div>
  );
}

// ─── Werknemer selector ───────────────────────────────────────────────────────
function WerknemerContextBar({ demo }) {
  return (
    <div style={{ background: T.bgSec, border: `0.5px solid ${T.border}`, borderRadius: 10, padding: "9px 14px", marginBottom: 14, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.textTer, textTransform: "uppercase", letterSpacing: ".05em", fontFamily: T.font }}>Werknemer context</span>
      {[
        { label: "Naam", val: demo.naam },
        { label: "Leeftijd", val: `${demo.leeftijd} jaar` },
        { label: "Salaris", val: eurCompact(demo.salaris) },
        { label: "Premie", val: `${demo.premiePerc}%` },
        { label: "Risicoprofiel", val: demo.risicoProfiel },
      ].map(k => (
        <div key={k.label} style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textTer, fontFamily: T.font }}>{k.label}:</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: k.label === "Salaris" ? T.mono : T.font }}>{k.val}</span>
        </div>
      ))}
      <span style={{ marginLeft: "auto", fontSize: 11, color: T.textTer, fontFamily: T.font }}>Demo-werknemer · vervang door import</span>
    </div>
  );
}

// ─── Opslaan footer ───────────────────────────────────────────────────────────
function OpslaanFooter({ onOpslaan, onNaarAdvies }) {
  const [status, setStatus] = useState("idle");
  const opslaan = () => { setStatus("saving"); setTimeout(() => { setStatus("saved"); setTimeout(() => setStatus("idle"), 3000); }, 800); };
  return (
    <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 4 }}>
      <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font }}>
        {status === "saved" ? <span style={{ color: T.accent, fontWeight: 500 }}>✓ Beleggingsanalyse opgeslagen in dossier</span> : <span>Lifecycle, URM-projecties en risicokoppeling worden opgeslagen</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={opslaan} disabled={status === "saving"}
          style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${status === "saved" ? T.accent : T.border}`, background: status === "saved" ? T.accentBg : T.bgSec, color: status === "saved" ? T.accent : T.text, fontSize: 13, fontWeight: 500, cursor: status === "saving" ? "not-allowed" : "pointer", fontFamily: T.font, opacity: status === "saving" ? 0.6 : 1 }}>
          {status === "saving" ? "Opslaan…" : status === "saved" ? "✓ Opgeslagen" : "Opslaan in dossier"}
        </button>
        <button onClick={onNaarAdvies}
          style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, display: "flex", alignItems: "center", gap: 7 }}>
          Naar adviesrapport
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Root Module C ────────────────────────────────────────────────────────────
export default function ModuleC({ onTerug = () => {}, onNaarAdvies = () => {} }) {
  const [aanbieder, setAanbieder] = useState("Nationale-Nederlanden");
  const [geselecteerdeLCs, setGeselecteerdeLCs] = useState(["Nationale-Nederlanden", "ASR", "Centraal Beheer"]);

  useEffect(() => {
    if (!document.getElementById("af-font")) {
      const l = document.createElement("link"); l.id = "af-font"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  const toggleLC = (naam) => {
    setGeselecteerdeLCs(prev =>
      prev.includes(naam)
        ? prev.length > 1 ? prev.filter(n => n !== naam) : prev // minimaal 1
        : [...prev, naam]
    );
  };

  return (
    <div style={{ fontFamily: T.font, maxWidth: 920, margin: "0 auto", padding: "0 0 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textTer, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3, fontFamily: T.font }}>Analyse · Module 2.3</div>
          <h2 style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 700, color: T.text, fontFamily: T.font }}>Beleggingsbeleid & Lifecycles</h2>
          <p style={{ margin: 0, fontSize: 13, color: T.textSec }}>Lifecycle-visualisatie, URM-projecties in 3 scenario's en koppeling aan het risicoprofiel van de werkgever.</p>
        </div>
        <button onClick={onTerug}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgSec, fontSize: 12, cursor: "pointer", fontFamily: T.font, color: T.textSec, flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Terug
        </button>
      </div>

      {/* Context */}
      <WerknemerContextBar demo={DEMO} />

      {/* Aanbieder selector */}
      <AanbiederSelector value={aanbieder} onChange={setAanbieder} />

      {/* 1. Lifecycle vergelijking */}
      <LifecycleVergelijking geselecteerd={geselecteerdeLCs} onSelect={toggleLC} />

      {/* 4. Lifecycle tijdlijn (per werknemer) */}
      <LifecycleTijdlijn leeftijd={DEMO.leeftijd} aanbieder={aanbieder} />

      {/* 2+3. URM + AOW stacking + koopkracht + repareer */}
      <URMModule
        params={{ ...DEMO, franchise: 17545 }}
        aanbieder={aanbieder}
      />

      {/* Footer */}
      <OpslaanFooter onNaarAdvies={onNaarAdvies || (() => {})} />
    </div>
  );
}
