# productscout

Įrankis, kuris randa produktus, **kurių paklausa kyla, o pardavėjų dar mažai**.

## Kodėl ne „produktai, kurių niekas neparduoda"

Pažodžiui tai blogas filtras. Nulinė konkurencija beveik visada reiškia nulinę
paklausą — jei 200 dropshipperių nepardavinėja daikto, dažniausiai jie jį jau
bandė ir numetė.

Teisinga idėjos forma yra *santykis*: paklausa jau kyla, o pardavėjų pasiūla dar
nespėjo. Langas tarp „paklausa atsiranda" ir „50 parduotuvių pardavinėja"
paprastai 4–12 savaičių. Įrankis šį skirtumą daro matomą:

| Žyma | Reikšmė |
|---|---|
| `early_window` | paklausa kyla, konkurencija dar maža — **tai taikinys** |
| `crowded` | paklausa gal ir kyla, bet rinka jau prisotinta — vėlu |
| `zero_demand_trap` | niekas neparduoda **ir** niekas neperka — ne galimybė, o miręs produktas |

## Ką įrankis tikrina

1. **Paklausos momentum** — ar kilimas tikras, ar triukšmas. Atmeta:
   - vienos savaitės naujienų šuolius (2.5x augimas → balas 0.09);
   - jau išsilyginusį kilimą (`deceleration` — langas praėjo);
   - sezoninius pakilimus, kurie kartojasi kasmet.
2. **Konkurencijos prisotinimą** — AliExpress / Amazon / Shopify parduotuvių /
   aktyvių ads skaičiai, logaritminėje skalėje. Parduotuvių ir ads skaičiai
   sveria daugiau nei marketplace listingai (tie išpūsti dublikatų).
3. **Vieneto ekonomiką** — savikaina, siuntimas, mokėjimų mokesčiai, grąžinimai
   → marža, lūžio CAC, reikalingas ROAS.
4. **Atitiktį ir logistiką** — prekės ženklai, papildai, vape, medicininiai
   teiginiai blokuoja iškart. CE / WEEE / CPNP / GPSR / EN 71 — įspėjimai su
   realia kaina. Žr. `python -m productscout tags`.

Bendras balas — **svertinis geometrinis vidurkis**, sąmoningai: produkto be
maržos neišgelbsti kylanti paklausa, todėl nulis vienoje ašyje turi nutempti
visą balą, o ne būti suvidurkintas.

**Patikimumas rodomas atskirai nuo balo** — kad matytum, kada aukštas balas
remiasi plonais duomenimis.

## Paleidimas

```bash
pip install -r productscout/requirements.txt     # tik gyviems duomenims ir YAML
python -m productscout scan -i fixtures/candidates.example.yaml -v
python -m productscout tags                      # atitikties žymų sąrašas
python -m productscout scan -i mano.yaml -f markdown -o ataskaita.md
```

Gyvi duomenys (reikia interneto, geriausia iš namų IP — ne iš serverio):

```bash
python -m productscout scan -i mano.yaml --fetch --geo LT
```

## Kandidatų failas

```yaml
candidates:
  - term: collagen face roller
    category: beauty
    attributes: [cosmetics, gpsr_responsible_person]
    economics:
      supplier_cost: 3.10
      inbound_shipping: 2.00
      target_price: 27.99      # praleisk - apskaičiuos pagal 65% maržos tikslą
      weight_grams: 180
    competition:
      aliexpress_listings: 210
      shopify_stores: 5
      active_ads: 8
    series:                    # praleisk, jei naudoji --fetch
      - source: google_trends
        points: [["2025-09-01", 14.2], ["2025-09-08", 15.1]]
```

Visi `competition` ir `economics` laukai neprivalomi — trūkstami duomenys
sumažina patikimumą, bet skenavimas vis tiek suveiks.

## Ką automatizuoja ir ko ne

**Automatizuota:** paklausos serijų traukimas (Google Trends, Wikipedia
pageviews, CSV iš mokamų įrankių), visa matematika, atitikties filtrai,
kainodara, ataskaitos.

**Rankomis (sąmoningai):** konkurencijos skaičiai. Oficialaus API „kiek Shopify
parduotuvių pardavinėja šį daiktą" nėra, o scraping'as laužosi kas savaitę ir
pažeidžia ToS. Realiai tai 2 minutės vienam kandidatui:

- `aliexpress_listings` — AliExpress paieška, rezultatų skaičius
- `shopify_stores` — Google: `"produkto pavadinimas" site:myshopify.com`
- `active_ads` — Meta Ad Library / TikTok Creative Center, aktyvių skelbimų kiekis

Jei turi Minea / PiPiADS / Helium 10 prenumeratą — eksportuok CSV ir įkelk per
`python -m productscout import-csv`.

## Ribos, kurias verta žinoti

- Google Trends yra neoficialus ir riboja užklausas; iš datacentro IP grąžina
  429 beveik iš karto.
- Wikipedia pageviews naudingi tik terminams, turintiems straipsnį — commodity
  daiktams jų nebus.
- Įrankis **reitinguoja hipotezes, o ne prognozuoja pardavimus**. Aukštas balas
  reiškia „vertas 50 € testo", ne „šitas pavyks".

## Testai

```bash
python -m pytest tests/ -q
```

Testai fiksuoja kalibravimą, ne padengimą: kiekvienas jų pririša sprendimą,
kurį įrankis privalo priimti teisingai, kad jo išvestimi būtų galima pasitikėti.
