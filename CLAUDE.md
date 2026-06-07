# CLAUDE.md — Koffeinkollen

Kontext för Claude Code och för att bygga vidare på koffein-appen.

## Vad det är
En PWA som modellerar koffein i blodet över dagen och flaggar sömnrisk.
**Ren statisk HTML/CSS/JS i en fil, ingen byggprocess, inga externa API:er** – all logik
körs lokalt och all data sparas i `localStorage`.

- **Repo:** `andersbehrens/koffeinkollen` (publikt, GitHub Pages från `main` / root)
- **Design:** "Warm Roast" — cream-bg `#f5ede1`, brun ink `#3b2a1f`, amber accent `#c77d3a`,
  Fraunces-serif för rubriker/stora tal, Inter för övrigt. Valdes från `moodboard.html`.
- Källa till modellen: `Can you find an equation giving the level of caffe.pdf` (i repot).

## Filer
```
index.html      Hela appen (HTML + CSS + JS inline)
manifest.json   PWA-manifest (relativa sökvägar → funkar i subpath /koffeinkollen/)
sw.js           Service worker. Bumpa CACHE_NAME (koffein-app-vN) vid ändring av appen
icons/          icon-192/512.png (kaffekopp, genererad – se git-historik för PIL-skript)
scripts/        Verifieringsverktyg (körs med Node, kräver Chrome)
moodboard.html  De fyra designförslagen
```

## Kör lokalt
```sh
python3 -m http.server 8772    # http://localhost:8772
```

## ⚠️ Verifiera ALLTID innan du säger "klart" (uttryckligt önskemål)
```sh
node scripts/check-app.mjs    http://localhost:8772/index.html   # funktionell röktest i Chrome
node scripts/check-layout.mjs http://localhost:8772/index.html   # overflow 360–480px
```
`check-app.mjs` laddar appen, lägger till en kaffe, och verifierar att kurvan ritas,
nivån räknas, sömnrisk visas, inställningar öppnas, koffeinkänslighet ändrar halveringstiden,
och att intag finns kvar efter omladdning (localStorage). Avslutar med kod 1 vid fel.

## Modellen (PK, en-kompartment, första ordningens elimination)
```
Vd  = 0,6 L/kg × vikt
k   = ln(2) / halveringstid
C(t)= Σ_i  dos_i / Vd · e^(−k·(t − t_i))   för t_i ≤ t      [mg/L]   (instant absorption)
```
Halveringstid `tHalf(profile)`: bas **5 h** (litteraturens snitt; intervall 3–7 h),
multiplikativa faktorer (faktagranskade mot PK-litteratur):
| Faktor | × | Resultat | Litteratur |
|---|---|---|---|
| Rökning | 0,70 | 3,5 h | 3–4 h (upp till ½ snabbare) |
| P-piller (kvinna) | 2,0 | 10 h | 8–10 h |
| Sen graviditet (kvinna) | 2,5 | 12,5 h | 10–18 h |
| Svår leversjukdom | 2,5 | 12,5 h | cirros >12 h |
| ≥65 år | 1,10 | 5,5 h | blandad evidens, måttlig |
| Känslig / Tål mycket | 1,6 / 0,8 | 8 / 4 h | känsliga ~7,4 h (1 studie) |
Klampas till 1,5–24 h. **Validerat:** 70 kg → Vd 42 L → 100 mg ger topp 2,38 mg/L (matchar PDF);
halveringstiderna ligger inom publicerade intervall. Sömntrösklar (<1 / 1–2 / >2 mg/L) är **pragmatiska, ej formellt validerade**. Bäst belagda
effektgräns: 7,34 µmol/L ≈ 1,4 mg/L för mätbart minskad djupsömn (Baur 2024) – faller i
appens "måttliga" band; "1 mg/L" är medvetet satt under den för marginal. Detta står även
i appens referenssektion.

Sömnrisk vid läggdags: <1 mg/L låg · 1–2 måttlig · >2 hög. Visar även när nivån går under 1 mg/L.

## Viktiga implementationsdetaljer
- **Tidsaxel** `AX0=5 … AX1=24` (05:00–24:00). `timeToX(t)` mappar till 0..1; samma mappning
  används av både kurvan (SVG) och tidslinjen så koppar och kurva ligger i linje.
- **Dragbar tidslinje:** pointer events med `setPointerCapture`. `pointerdown` sätter start,
  `pointermove` (>3px = drag) uppdaterar `it.time` (5-min-steg) och kör `quickUpdate()` som bara
  ritar om kurvan (ingen full DOM-rebuild → mjukt). `pointerup` utan rörelse = markera/avmarkera
  koppen (visar borttagningsrad).
- **State i localStorage:** `caf_profile` (profilen) och `caf_intakes` (`{day, items}`).
  Intag **nollställs varje ny dag** (jämför `day` mot dagens datum). Intagstid lagras som
  timme-flyttal inom dagen.
- **Källbibliotek** `SOURCES` (key/name/emoji/mg). Tryck lägger till vid "nu", avrundat till 5 min.

## Deploy / git
Samma mönster som GoodDay (se det projektets CLAUDE.md). Kort:
- Token finns i `ekgapp/.git/config` (klassisk PAT, scope `repo` räcker – **inga Actions/workflows
  i detta repo**, så `workflow`-scope behövs ej).
- **Spara aldrig token i `.git/config`** – pusha med engångs-URL, maskera i utskrift:
  ```sh
  TOKEN=$(git -C ../ekgapp config --get remote.origin.url | sed -E 's#https://([^@]+)@.*#\1#')
  git push "https://${TOKEN}@github.com/andersbehrens/koffeinkollen.git" main 2>&1 | sed -E "s#ghp_[A-Za-z0-9_]+#TOKEN#g"
  ```
- `origin` ska peka på den rena URL:en (utan token). Aktivera Pages via API (källa main/root).
- Ändrar du `index.html`/`sw.js`: bumpa `CACHE_NAME` i `sw.js`.

## Idéer att bygga vidare på
Absorptionsfas (inte bara instant), fler/egna koffeinkällor med valbar dos, historik över
flera dagar, notis "dags att sluta dricka kaffe för att kunna sova", koffeinfri-streak.
