# Koffeinkollen

En liten progressiv webapp (PWA) som visar hur mycket koffein du har i blodet över
dagen – och om nivån sannolikt stör nattsömnen.

## Funktioner

- ☕ **Källbibliotek** – lägg till bryggkaffe, espresso, te, energidryck, cola, tablett m.m. med ett tryck (typiska mg).
- 📈 **Kurva över dagen** – koffeinkoncentrationen (mg/L) timme för timme, med sömntröskel, läggdags- och nu-markör.
- ↔️ **Dragbar tidslinje** – varje intag är en kopp du kan dra fram/tillbaka för att ställa in tiden; kurvan uppdateras live.
- 😴 **Sömnrisk** – nivå vid läggdags (låg/måttlig/hög) och när du går under 1 mg/L.
- ⚙️ **Profil** – vikt, kön, läggdags, koffeinkänslighet, rökning, p-piller, graviditet, ålder, leversjukdom. Sparas lokalt.

## Modellen

En-kompartment farmakokinetisk modell (första ordningens elimination):

```
Vd = 0,6 L/kg × vikt
k  = ln(2) / halveringstid
C(t) = Σ (dos / Vd) · e^(−k·(t − intagstid))   [mg/L]
```

Halveringstid: 5 h som bas (litteraturens snitt), justerad av profilen (rökning,
p-piller, graviditet, leversjukdom, ålder, koffeinkänslighet). Sömntrösklar vid
läggdags: <1 mg/L låg, 1–2 mg/L måttlig, >2 mg/L hög risk. Parametrarna är
faktagranskade mot farmakokinetisk litteratur (se referenser i appens inställningar).

Allt körs lokalt i webbläsaren – inga API:er, ingen server, ingen data lämnar enheten.

## Lokalt

```sh
python3 -m http.server 8772    # öppna http://localhost:8772
```

> Uppskattning, inte medicinsk rådgivning.
