#!/usr/bin/env python3
"""
dnb_urm_extract.py
==================
AdviesFocus — DNB URM Scenarioset Extractie Pipeline
Versie: 1.0  |  Kwartaalfrequentie: januari / april / juli / oktober

Wat dit script doet
-------------------
1. Leest de DNB P-scenarioset Excel (20K scenario's, ~171 MB)
2. Simuleert voor elke combinatie van (leeftijd × equity_pct × horizon)
   de eindkapitalen over alle 20.000 scenario's
3. Berekent P5 / P50 / P95 percentielwaarden → die worden de
   pessimistisch / verwacht / optimistisch URM-scenario's
4. Schrijft een compacte JSON lookup-tabel (~50 KB) die in Supabase
   wordt opgeslagen en door module C live wordt gebruikt

Gebruik
-------
  pip install pandas numpy openpyxl tqdm

  python dnb_urm_extract.py \
      --input  "CP2022 P scenarioset 20K 2026Q1.xlsx" \
      --output urm_lookup_2026Q1.json \
      --kwartaal 2026Q1

De output JSON wordt via de AdviesFocus admin-uploadpagina naar
Supabase gepusht (tabel: urm_scenariosets).

Tabblad-structuur DNB Excel (standaard)
---------------------------------------
- Readme       : Toelichting en modelparameters
- Returns      : Kolommen = [scenario_id, jaar_1..jaar_60]
                 Rijen    = 20.000 scenario's
                 Waarden  = netto jaarrendement per categorie
- De kolommen zijn gesplitst per beleggingscategorie:
  * Aandelen (equity)
  * Obligaties (bonds)
  * (Inflatie staat apart maar is voor de URM-communicatieberekening
     niet vereist — DNB schrijft nominale bedragen voor)

Rekenlogica (URM-DC communicatiedoeleinden, art. 14a Regeling Pw)
-----------------------------------------------------------------
Voor elk scenario s, leeftijd l, equity_pct e, horizon H (jaren):

  kapitaal_s = Σ_{t=1}^{H}  jaarlijkse_inleg × Π_{j=t}^{H} (1 + r_j^s)

waarbij r_j^s het gemengde rendement is in jaar j van scenario s:
  r_j^s = e × aandelen_rendement_j_s + (1-e) × obligatie_rendement_j_s

Na berekening over alle 20.000 scenario's:
  P5  → pessimistisch
  P50 → verwacht
  P95 → optimistisch

De jaarlijkse inleg is 1 euro (de adviseur schaalt zelf met
grondslag × premiepercentage in module C).
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from tqdm import tqdm

# ─── Configuratie ──────────────────────────────────────────────────────────────

# Leeftijden waarvoor we berekenen (jaren tot AOW)
AOW_LEEFTIJD = 67
LEEFTIJDEN   = list(range(20, 67))          # 20 t/m 66 jaar

# Equity-percentages (% zakelijke waarden in lifecycle)
EQUITY_PCT   = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

# Percentielwaarden die de drie URM-scenario's bepalen
P_PESSIMISTISCH = 5    # P5
P_VERWACHT      = 50   # P50 (mediaan)
P_OPTIMISTISCH  = 95   # P95

# Kostencorrectie per DNB advies Commissie Parameters 2022
KOSTENAFSLAG_BPS = 20   # 20 basispunten per jaar

# ─── Hulpfuncties ──────────────────────────────────────────────────────────────

def laad_rendementscenarios(xlsx_pad: Path) -> dict:
    """
    Laadt de rendementskolommen uit de DNB Excel.

    Geeft terug:
      {
        'aandelen': np.array [n_scenarios × n_jaren],
        'obligaties': np.array [n_scenarios × n_jaren],
        'n_scenarios': int,
        'n_jaren': int,
      }

    De exacte kolomnamen en tabbladnamen kunnen per kwartaal licht
    afwijken — dit script probeert de meest voorkomende varianten.
    """
    print(f"\n📂 Excel inladen: {xlsx_pad.name} ({xlsx_pad.stat().st_size / 1e6:.0f} MB)")
    print("   Dit duurt 2–4 minuten voor het 20K bestand...")

    # Probeer de 'Returns' tab — exacte naam varieert soms
    tab_kandidaten = ["Returns", "Rendementen", "Scenario returns", "Sheet1"]
    df_raw = None

    xl = pd.ExcelFile(xlsx_pad)
    beschikbare_tabs = xl.sheet_names
    print(f"   Gevonden tabbladen: {beschikbare_tabs}")

    for tab in tab_kandidaten:
        if tab in beschikbare_tabs:
            print(f"   Inladen tabblad: '{tab}'")
            df_raw = pd.read_excel(xlsx_pad, sheet_name=tab, header=0, index_col=0)
            break

    if df_raw is None:
        # Fallback: pak het grootste tabblad op basis van kolomaantal
        max_cols = 0
        for tab in beschikbare_tabs:
            if tab.lower() in ["readme", "toelichting", "parameters"]:
                continue
            df_test = pd.read_excel(xlsx_pad, sheet_name=tab, nrows=5)
            if len(df_test.columns) > max_cols:
                max_cols = len(df_test.columns)
                df_raw = pd.read_excel(xlsx_pad, sheet_name=tab, header=0, index_col=0)
                print(f"   Fallback: tabblad '{tab}' ({max_cols} kolommen)")

    if df_raw is None:
        raise ValueError("Kon geen rendementsdata vinden. Controleer de Excel-structuur.")

    print(f"   Geladen: {df_raw.shape[0]} scenario's × {df_raw.shape[1]} kolommen")

    # DNB splits de rendementen per categorie in blokken
    # Probeer kolommen te identificeren op basis van namen
    kolom_namen = [str(c).lower() for c in df_raw.columns]

    # Zoek de blokken: aandelen en obligaties
    # Typische DNB kolomnaampatronen:
    #   "equity_1", "equity_2" ... of "stocks_1" ... of gewoon jaar-nummers
    #   "bonds_1", "bonds_2" ... of "fixed_income_1" ...
    # Als er geen herkenbare split is, ga er dan van uit dat de eerste
    # helft aandelen is en de tweede helft obligaties (gangbare structuur)

    n_jaren = None
    aandelen_cols = []
    obligatie_cols = []

    # Zoek op sleutelwoorden
    for i, k in enumerate(kolom_namen):
        if any(w in k for w in ["equity", "aandelen", "stocks", "zakelijk"]):
            aandelen_cols.append(i)
        elif any(w in k for w in ["bond", "obligat", "fixed", "rente"]):
            obligatie_cols.append(i)

    if aandelen_cols and obligatie_cols:
        n_jaren = max(len(aandelen_cols), len(obligatie_cols))
        aandelen  = df_raw.iloc[:, aandelen_cols[:n_jaren]].values.astype(float)
        obligaties = df_raw.iloc[:, obligatie_cols[:n_jaren]].values.astype(float)
        print(f"   Kolommen herkend: {n_jaren} jaren per categorie (op naam)")
    else:
        # Fallback: eerste helft = aandelen, tweede helft = obligaties
        n_totaal = df_raw.shape[1]
        n_jaren  = n_totaal // 2
        aandelen  = df_raw.iloc[:, :n_jaren].values.astype(float)
        obligaties = df_raw.iloc[:, n_jaren:n_jaren*2].values.astype(float)
        print(f"   Kolommen herkend: {n_jaren} jaren (helft/helft fallback)")

    # Pas kostencorrectie toe (20 bps per jaar)
    kostenafslag = KOSTENAFSLAG_BPS / 10_000
    aandelen   = aandelen   - kostenafslag
    obligaties = obligaties - kostenafslag

    return {
        "aandelen":   aandelen,
        "obligaties": obligaties,
        "n_scenarios": df_raw.shape[0],
        "n_jaren":    n_jaren,
    }


def bereken_urm_lookup(data: dict) -> list[dict]:
    """
    Berekent de URM-lookup tabel voor alle combinaties van
    (leeftijd × equity_pct).

    Retourneert een lijst van dicts:
      [
        {
          "leeftijd": 45,
          "equity_pct": 60,
          "horizon": 22,          # AOW_LEEFTIJD - leeftijd
          "p5_factor": 14.32,     # per € jaarlijkse inleg
          "p50_factor": 19.87,
          "p95_factor": 28.14,
        },
        ...
      ]

    De 'factor' is het eindkapitaal per €1 jaarlijkse inleg.
    Module C vermenigvuldigt dit met de werkelijke jaarlijkse inleg
    (grondslag × premie%) om het eindkapitaal te berekenen.
    """
    aandelen   = data["aandelen"]
    obligaties = data["obligaties"]
    n_scenarios = data["n_scenarios"]
    n_jaren_max = data["n_jaren"]

    resultaten = []

    combis = [(l, e) for l in LEEFTIJDEN for e in EQUITY_PCT]
    print(f"\n⚙️  Berekening: {len(combis)} combinaties × {n_scenarios} scenario's")
    print("   (dit duurt 5–15 minuten afhankelijk van hardware)")

    for leeftijd, equity_pct in tqdm(combis, desc="URM berekening"):
        horizon = AOW_LEEFTIJD - leeftijd
        if horizon <= 0:
            continue
        horizon = min(horizon, n_jaren_max)

        e = equity_pct / 100.0
        b = 1.0 - e

        # Gemengd rendement per jaar per scenario: [n_scenarios × horizon]
        gemengd = e * aandelen[:, :horizon] + b * obligaties[:, :horizon]

        # Cumulatief eindkapitaal per € inleg per jaar (annuïteit-achtig)
        # kapitaal_s = Σ_{t=1}^{H} Π_{j=t}^{H} (1 + r_j^s)
        # = premies die elk jaar worden ingelegd en tot einde doorgroeien
        kapitalen = np.zeros(n_scenarios)
        for t in range(horizon):
            # Inleg op moment t groeit door de resterende jaren
            resterende = gemengd[:, t:]          # [n_scenarios × (H-t)]
            groei      = np.prod(1.0 + resterende, axis=1)  # [n_scenarios]
            kapitalen += groei                   # elke €1 inleg op jaar t

        p5  = float(np.percentile(kapitalen, P_PESSIMISTISCH))
        p50 = float(np.percentile(kapitalen, P_VERWACHT))
        p95 = float(np.percentile(kapitalen, P_OPTIMISTISCH))

        resultaten.append({
            "leeftijd":   leeftijd,
            "equity_pct": equity_pct,
            "horizon":    horizon,
            "p5_factor":  round(p5,  4),
            "p50_factor": round(p50, 4),
            "p95_factor": round(p95, 4),
        })

    return resultaten


def maand_uitkering(eindkapitaal: float,
                    uitkeringsrente: float = 0.02,
                    uitkeringsjaren: int   = 20) -> float:
    """
    Converteert eindkapitaal naar maandelijkse uitkering (annuïteit).
    Standaard: 2% uitkeringsrente, 20 jaar uitkering.
    """
    r = uitkeringsrente / 12
    n = uitkeringsjaren * 12
    if r == 0:
        return eindkapitaal / n
    return eindkapitaal * (r * (1 + r)**n) / ((1 + r)**n - 1)


# ─── Hoofdprogramma ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="DNB URM scenarioset → AdviesFocus lookup-tabel"
    )
    parser.add_argument(
        "--input",  "-i",
        required=True,
        help="Pad naar DNB P-scenarioset Excel (bijv. CP2022 P scenarioset 20K 2026Q1.xlsx)"
    )
    parser.add_argument(
        "--output", "-o",
        default="urm_lookup.json",
        help="Output JSON bestandsnaam (default: urm_lookup.json)"
    )
    parser.add_argument(
        "--kwartaal", "-k",
        required=True,
        help="Kwartaal label (bijv. 2026Q1) — wordt meegeslagen als metadata"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Testmodus: gebruik slechts 500 scenario's voor snelle validatie"
    )
    args = parser.parse_args()

    xlsx_pad = Path(args.input)
    if not xlsx_pad.exists():
        print(f"❌ Bestand niet gevonden: {xlsx_pad}")
        sys.exit(1)

    print("=" * 60)
    print("  AdviesFocus — DNB URM Extractie Pipeline")
    print(f"  Kwartaal : {args.kwartaal}")
    print(f"  Input    : {xlsx_pad.name}")
    print(f"  Output   : {args.output}")
    print(f"  Testmodus: {'ja (500 scenario's)' if args.test else 'nee (volledige set)'}")
    print("=" * 60)

    # 1. Laad data
    data = laad_rendementscenarios(xlsx_pad)

    if args.test:
        data["aandelen"]    = data["aandelen"][:500]
        data["obligaties"]  = data["obligaties"][:500]
        data["n_scenarios"] = 500
        print("\n⚠️  Testmodus: slechts 500 scenario's gebruikt")

    # 2. Bereken
    lookup = bereken_urm_lookup(data)

    # 3. Schrijf output
    output = {
        "meta": {
            "kwartaal":       args.kwartaal,
            "aangemaakt_op":  datetime.now().isoformat(),
            "n_scenarios":    data["n_scenarios"],
            "n_jaren":        data["n_jaren"],
            "kostenafslag_bps": KOSTENAFSLAG_BPS,
            "aow_leeftijd":   AOW_LEEFTIJD,
            "percentiel_pessimistisch": P_PESSIMISTISCH,
            "percentiel_verwacht":      P_VERWACHT,
            "percentiel_optimistisch":  P_OPTIMISTISCH,
            "bronbestand":    xlsx_pad.name,
        },
        "lookup": lookup
    }

    output_pad = Path(args.output)
    with open(output_pad, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    bestand_kb = output_pad.stat().st_size / 1024
    print(f"\n✅ Klaar!")
    print(f"   Lookup-rijen : {len(lookup)}")
    print(f"   Bestandsgrootte: {bestand_kb:.0f} KB")
    print(f"   Output: {output_pad.absolute()}")
    print()
    print("Volgende stap: upload dit JSON-bestand via de AdviesFocus")
    print("admin-pagina → Instellingen → URM Scenarioset → Upload")

    # 4. Validatie preview
    print("\n📊 Validatie — steekproef (leeftijd 45, equity 60%):")
    voorbeeld = next(
        (r for r in lookup if r["leeftijd"] == 45 and r["equity_pct"] == 60),
        None
    )
    if voorbeeld:
        inleg_jaar  = 10_000  # €10.000/jaar inleg
        print(f"   Jaarlijkse inleg  : €{inleg_jaar:,.0f}")
        print(f"   Horizon           : {voorbeeld['horizon']} jaar")
        for scenario, factor_key in [
            ("Pessimistisch (P5)",  "p5_factor"),
            ("Verwacht     (P50)", "p50_factor"),
            ("Optimistisch (P95)", "p95_factor"),
        ]:
            eindkap  = inleg_jaar * voorbeeld[factor_key]
            maand    = maand_uitkering(eindkap)
            print(f"   {scenario}: €{eindkap:>10,.0f} eindkapitaal → €{maand:,.0f}/mnd")


if __name__ == "__main__":
    main()
