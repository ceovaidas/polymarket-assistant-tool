# GNARHEAD — parduotuvės paleidimo gidas (nuo nulio iki pirmo pardavimo)

> Visa parduotuvė ir tekstai – **anglų kalba**. Šis gidas – lietuviškai, tau.
> Šiandien spalio pradžia → turi ~8 savaites iki Kalėdų pirkimų piko. Kalėdinių siuntų iš Kinijos riba ~gruodžio 5–10 d., todėl tiekėją reikia susirasti **šią savaitę**.

---

## 0. Brendas
**Pavadinimas:** GNARHEAD („gnar“ – slidininkų/snieglenčių slengas „kietas, ekstremalus“ + „head“).
Kodėl ne kopija: Rooog naudoja LEGO figūrėlės galvos formą — LEGO tą formą turi užregistravę kaip prekės ženklą, ten rizika. Tavo veidai (senukas, katė, tigras, korgis, elfas) – sava kryptis.

Prieš pirkdamas domeną patikrink:
1. `gnarhead.com` / `.co` / `.shop` laisvumą (Shopify → Settings → Domains → Buy).
2. Instagram/TikTok `@gnarhead` (arba `@gnarhead.co`, `@wearegnarhead`).
3. USPTO ir EUIPO paieškas (tmsearch.uspto.gov, euipo.europa.eu) — ar nėra užregistruoto drabužių klasėje (25).
Atsarginiai vardai: **LIFTFACE**, **SNOWMUG**, **POWDERFACE**, **GNARMASK**.

---

## 1. Tiekėjas (svarbiausia šią savaitę)
Tavo nuotraukose esantys produktai (AliExpress, €5–10) — tinka startui.

| Variantas | Kam | Pastabos |
|---|---|---|
| **CJdropshipping** (rekomenduoju) | Automatinis užsakymų perdavimas, sandėliai US/EU | Gali nusiųsti AliExpress nuorodą → jie randa tą patį gamintoją („Sourcing request“). Galima brendinta pakuotė/maišelis. |
| **DSers + AliExpress** | Pigiausia pradžia | Lėtesnis pristatymas (10–20 d.), nėra brendo. |
| **1688 / tiesioginis gamintojas** | Kai bus 50+ pardavimų/d. | Savo dizainai, logotipas, pigiau, bet minimalus kiekis (100–300 vnt.). |

**Žingsniai:**
1. AliExpress susirask 3–5 tiekėjus kiekvienam veidui (senukas, katė, tigras, korgis, elfas). Rinkis: 4.7★+, 100+ parduota, yra *tikrų* pirkėjų nuotraukų.
2. **Užsisakyk pavyzdžius sau** (po 1 vnt. kiekvieno, ~€40). Patikrink kokybę, kvapą, ar telpa po šalmu, ar akinių anga tinka. Nufilmuok pats — tai bus tavo pirmas tikras turinys.
3. CJdropshipping pateik „Product Sourcing“ užklausą su AliExpress nuorodomis → gausi kainą su pristatymu į US/EU.
4. **Gavęs pavyzdžius, pataisyk specifikacijas** puslapyje (medžiaga, pamušalas, dydis) pagal tai, ką realiai gavai – neteisingi teiginiai = grąžinimai ir ginčai.
5. Paprašyk tiekėjo: be AliExpress logotipų pakuotėje, su juodu maišeliu (kaip Rooog) — paprastai +$0.5–1.

> ⚠️ Nenaudok tiekėjo nuotraukų su vandens ženklais (pvz. „cn1115979453jvbae“) — tai svetima nuosavybė ir atrodo pigiai. Darysi savo AI nuotraukas (žr. 5 skyrių).

---

## 2. Kainodara (skaičiai)
| | 1 kaukė | 2 kaukės (−15%) | 3 kaukės (−25%) |
|---|---|---|---|
| Pardavimo kaina | **$39.99** | $67.98 | $89.98 |
| Prekė + pristatymas (įvertis) | ~$14 | ~$26 | ~$38 |
| Shopify mokesčiai (~3% + $0.30) | ~$1.50 | ~$2.30 | ~$3.00 |
| **Lieka reklamai ir pelnui** | **~$24** | **~$40** | **~$49** |

- **Break-even CPA** (kiek gali sumokėti reklamai už 1 pirkimą): ~$24 už vienetinį užsakymą. Tikslas – vidutinis krepšelis ≥ $60 per bundles.
- Rooog parduoda už $44 — tavo $39.99 konkurencinga.
- **„Compare-at“ (perbraukta) kaina:** ES (Omnibus direktyva) perbraukta kaina turi būti realiai taikyta mažiausia kaina per paskutines 30 d. Jei niekada nepardavinėjai už $54.99 — **nerašyk jos ES pirkėjams** arba pradžioje 1–2 savaites pardavinėk už $54.99. Saugiausia: vietoj perbrauktos kainos rodyti tik bundles nuolaidas.

---

## 3. Shopify paruošimas (žingsnis po žingsnio)
1. **Paskyra:** shopify.com → nemokamas bandymas → planas „Basic“. Parduotuvės šalis – Lietuva, valiuta – **USD** (ar EUR, jei taikysi Europą; Shopify Markets gali rodyti abi).
2. **Tema:** Online Store → Themes → palik **Dawn** (nemokama, greita).
3. **Įkelk mano failus:** Themes → ⋯ → **Edit code**:
   - `Assets` → *Add a new asset* → įkelk `theme/assets/gnarhead-landing.css` ir `gnarhead-landing.js`
   - `Snippets` → *Add a new snippet* → pavadink `gnarhead-icon` → įklijuok `theme/snippets/gnarhead-icon.liquid` (piktogramos — būtina)
   - `Snippets` → *Add a new snippet* → pavadink `gnarhead-art` → įklijuok `theme/snippets/gnarhead-art.liquid` (iliustracijos — būtina)
   - Kol neįkėlei nuotraukų, puslapyje rodomos iliustracijos; techniniai užrašai („upload…“) matosi tik redaktoriuje. Video blokas atsiranda tik įkėlus bent vieną video.
   - `Sections` → *Add a new section* → pavadink `gnarhead-product-landing` → įklijuok `.liquid` turinį
   - `Templates` → *Add a new template* → tipas `product`, pavadinimas `landing`, JSON → įklijuok `product.landing.json`
4. **Produktas:** Products → Add product
   - Title, aprašymas, kainos – iš `PRODUCT_COPY_EN.md`
   - Variants → Option name `Face` → 5 reikšmės
   - Kiekvienam variantui priskirk savo nuotrauką (tada paspaudus veidą keičiasi foto)
   - **Theme template → `landing`** (dešinėje apačioje)
5. **Bundle nuolaidos** (būtina, kitaip kainos puslapyje nesutaps su krepšeliu): Discounts → Create → *Amount off products* → **Automatic**:
   - „Crew of 2“: 15% kai minimalus kiekis 2
   - „Squad of 3“: 25% kai minimalus kiekis 3 (nustatyk, kad nesidubliuotų su pirmąja – Shopify taiko didžiausią)
   - Procentai turi sutapti su sekcijos nustatymais „Bundle discount %“.
6. **Nemokamas pristatymas nuo 2 vnt.:** Settings → Shipping → pridėk tarifą „Free shipping“ su sąlyga *minimum quantity / order price ≥ $60*.
7. **Pagrindinis puslapis = produktas:** paprasčiausia – Navigation meniu pašalink viską, o Online Store → Preferences / Theme customizer pradžios puslapyje įdėk „Featured product“ arba nukreipk reklamas tiesiai į `/products/funny-ski-mask`. Shopify neleidžia peradresuoti `/`, todėl visas reklamas ir „link in bio“ nukreipk į produkto URL.
8. **Temos išvaizda, kad viskas atrodytų vientisa** (Theme settings Customizer'yje):
   - *Colors → Scheme 1*: Background `#F2EFE8`, Text `#141414`, Solid button `#141414`. *Scheme 2* (juoda): Background `#141414`, Text `#F2EFE8`.
   - *Typography*: Headings – **Archivo Narrow** (Bold), Body – **Inter**.
   - *Announcement bar* → Scheme 2, tekstas: `FREE SHIPPING ON 2+ MASKS — 30-DAY RETURNS`.
   - *Header*: logo centre, meniu kairėje, „Sticky header“ – on scroll up.
   - *Buttons*: corner radius 0, shadow 0. *Product cards / Inputs*: corner radius 0.
   - **Logotipas:** iki tikro logotipo – tekstinis „GNARHEAD“. Vėliau užsisakyk wordmark'ą (Fiverr/Dribbble dizaineris, $50–150) siaurame storame šrifte, kaip puslapio antraštės.
9. **Atsiliepimai:** įdiek **Judge.me** (nemokamas). Jis užpildo `reviews.rating` metalaukus → žvaigždutės viršuje atsiras automatiškai. Iki tol žvaigždučių neberodo – tyčia.
10. **Policies:** Settings → Policies → sugeneruok Refund/Privacy/Terms/Shipping, papildyk iš copy failo.
11. **Mokėjimai:** Shopify Payments (+ Apple Pay, Google Pay, PayPal). Įjunk Shop Pay Installments, jei leidžia šalis.
12. **Programėlės (minimum):** CJdropshipping arba DSers, Judge.me, (vėliau) Klaviyo el. laiškams.
13. **Prieš paleidžiant:** Bogus Gateway testinis užsakymas, patikrink krepšelio nuolaidas su 1/2/3 vnt., mobilią versiją.

---

## 4. Teisiniai dalykai (trumpai, bet svarbu)
- **Veiklos forma Lietuvoje:** individuali veikla pagal pažymą arba MB. Pajamos turi būti deklaruojamos.
- **PVM:** pardavimai ES fiziniams asmenims > €10 000/metus → registracija OSS. US – kol kas paprastai nereikia.
- **Netikri atsiliepimai draudžiami** (JAV FTC taisyklė nuo 2024 m., ES taip pat). Jokių „+992 Reviews“ be realių pirkėjų. Sekcijoje atsiliepimų blokas skirtas tik tikriems.
- **Netikras skubumas** („60% OFF TODAY“, kuris galioja visada, netikri laikmačiai) ES laikomas nesąžininga komercine praktika. Naudok tikras akcijas (pvz. Black Friday – tikrai tik savaitgalį).
- **AI turinys:** TikTok ir Meta reikalauja pažymėti realistišką AI sugeneruotą turinį („AI-generated“ žymė). Pažymėk — reklamos nebus blokuojamos, o juokingam turiniui tai netrukdo.
- Nerodyk realių įžymybių veidų ir svetimų prekės ženklų (LEGO, Disney ir pan.) reklamose.

---

## 5. Turinys su AI (tavo pagrindinis ginklas)
### Kodėl nuotraukos svarbiausios
Puslapio dizainas sąmoningai ramus (smėlio fonas, juoda, viena oranžinė spalva) – kad **nuotraukos** būtų žvaigždė. Pigų „AI“ įspūdį dažniausiai sukuria ne maketas, o nuotraukos: kiekviena kitokio stiliaus, persotintos spalvos, tekstas ant paveikslėlių. Taisyklės:
- **Vienas stilius visoms:** tas pats šviesos tipas (saulėta diena, natūralios spalvos), ta pati kameros „nuotaika“ (lyg telefonu ar 35 mm juosta).
- **Jokio teksto ir ženkliukų ant nuotraukų** – tekstą rašo puslapis.
- **Fonai neperkrauti:** sniegas, keltuvo eilė, medinė kalnų kavinė.
- Swatch'ams (mažiems kvadratėliams prie „Face“) – po vieną švarią kaukės nuotrauką iš priekio vienodame fone.
- Proporcijos: galerija **4:5** (1600×2000), „crew“ kortelės **3:4**, video **9:16**, apatinis baneris **16:9**.

### Nuotraukos (Shopify galerijai — 4:5, 1600×2000)
Reikia ~6–8 kiekvienam veidui: herojaus kadras, iš arti, grupė, pakuotė, ant stalo (flat lay), su šalmu.
**Svarbu:** AI nuotraukos turi rodyti **tikrą tavo produktą** — sugeneruok iš tikros pavyzdžio nuotraukos (image-to-image / reference), kitaip pirkėjai gaus ne tai, ką matė → grąžinimai ir ginčai.

Promptų šablonai (anglų k.):
```
Hero: Editorial product photo of a knitted ski balaclava with a [grumpy old man face with white mustache], worn by a skier with mirrored goggles, standing in a ski resort lift line, bright sunny alpine day, snow, shallow depth of field, shot on 35mm film, muted natural colors, no text, vertical 4:5

Group: Five friends at a ski resort each wearing different funny knitted ski masks (old man, cat, tiger, corgi, christmas elf), goggles on helmets, laughing, pointing at camera, chairlift station behind, sunny, candid smartphone photo

Flat lay: Knitted [tiger face] ski balaclava with a black drawstring pouch and ski goggles on fresh snow, top-down product shot, soft daylight, clean composition
```

### Video (TikTok / Reels / Shorts — 9:16, 8–20 s)
Formulė: **kabliukas (0–2 s) → absurdiška situacija (2–10 s) → atskleidimas/produktas (10–15 s) → CTA**.

10 idėjų:
1. Senukas „senelis“ nusileidžia juodąja trasa ir daro salto → nusiima kaukę – jaunas vaikinas.
2. Instruktorius rodo grupei vaikų → visi vaikai korgiai.
3. Keltuvo eilė: kamera važiuoja per normalius veidus… tada katė žiūri tiesiai į kamerą.
4. „Rating ski masks in the lift line“ – paskutinis tigras gauna 11/10.
5. Senukas valgo fondue kalnų kavinėje, padavėja nesupranta.
6. Elfas kalėdų išvakarėse „pristatinėja dovanas“ snieglente.
7. Draugų grupė: „we told him it was a costume party“ – visi normalūs, jis senukas.
8. Slow-mo wipeout į sniegą, iš sniego išlenda korgio galva.
9. Unboxing: juodas maišelis → kaukė → užsideda → veidrodis → juokas.
10. „Gift reaction“: tėtis atidaro dovaną per Kalėdas.

Video prompto šablonas:
```
Vertical 9:16 smartphone video, a skier wearing a knitted ski balaclava with a grumpy old man face and white mustache plus mirrored goggles, carving down a sunny groomed slope then stopping in a spray of snow right in front of the camera and giving a thumbs up, ski resort background, handheld, realistic, energetic, 8 seconds
```

Įrankiai: Higgsfield, Kling, Google Veo, Runway — generuok 3–5 variantus, rink geriausią, CapCut'e pridėk tekstą, trending garsą ir pabaigoje produkto kadrą + „Link in bio“.

---

## 6. Pirmų 30 dienų planas
| Savaitė | Darai |
|---|---|
| 1 | Domenas, Shopify, tema, užsakai pavyzdžius, sukuri TikTok/IG/YT paskyras |
| 2 | 20–30 AI video. Kasdien 2–3 organiniai įrašai TikTok + Reels. Įkeli foto į parduotuvę |
| 3 | Gauni pavyzdžius → filmuoji tikrus video. Paleidi Meta/TikTok reklamą: $20–30/d., 3–5 kūriniai |
| 4 | Išjungi neveikiančius kūrinius (CTR < 1%, CPA > $30), didini veikiančius 20%/d. Black Friday pasiruošimas |

Metrikos: CTR ≥ 1.5%, add-to-cart ≥ 8%, konversija ≥ 2%, CPA < $24.

---

## 7. Failai šiame aplanke
| Failas | Kas |
|---|---|
| `preview/index.html` | Dizaino peržiūra – atsidaryk naršyklėje |
| `theme/sections/gnarhead-product-landing.liquid` | Shopify sekcija (viskas redaguojama per Customizer) |
| `theme/templates/product.landing.json` | Produkto šablonas su užpildytu turiniu |
| `theme/assets/gnarhead-landing.css/js` | Stilius ir logika (variantai, bundles, sticky mygtukas) |
| `theme/snippets/gnarhead-art.liquid` | Veidų iliustracijos ir mezginio raštas – rodomi vietoje nuotraukų, kol jų neįkėlei (būtina įkelti kaip snippet `gnarhead-art`) |
| `theme/snippets/gnarhead-icon.liquid` | Piktogramos ir kaukės siluetas (rodomas kol neįkeltos nuotraukos) |
| `preview/build.mjs` | Sugeneruoja peržiūrą iš tikro Shopify kodo (`cd preview && npm install && npm run build`) |
| `docs/PRODUCT_COPY_EN.md` | Visi angliški tekstai, SEO, politikos, reklamų kabliukai |
