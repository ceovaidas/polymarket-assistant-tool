# Jolly Haul — parduotuvės paleidimo gidas

> Parduotuvė ir visi tekstai – **anglų kalba**. Gidas – lietuviškai, tau.
> Dabar spalio pradžia: iki Kalėdų pirkimų piko liko ~8 savaitės. Siuntų iš Kinijos riba, kad spėtų iki Kalėdų – maždaug **gruodžio 5–10 d.** Tiekėjus reikia susirasti šią savaitę.

---

## 0. Brendas
**Jolly Haul** – *jolly* (linksmas, kalėdinis) + *haul* (TikTok žodis, kai žmonės rodo, ką prisipirko). Šūkis: **„Christmas, but make it viral.“**

Kodėl tinka: pavadinimas nepririštas prie vieno produkto – galėsi dėti kaukes, projektorius, kostiumėlius, lemputes ir viską, kas tą savaitę „sprogsta“ TikTok'e.

Prieš perkant domeną:
1. Patikrink `jollyhaul.com` / `.co` / `.shop` (Shopify → Settings → Domains).
2. TikTok / Instagram `@jollyhaul` (arba `@jollyhaul.co`, `@shopjollyhaul`).
3. USPTO ir EUIPO paieška (ar nėra užregistruoto ženklo 35 klasėje – mažmeninė prekyba).

Atsarginiai vardai: **Merry Haul**, **Yule Finds**, **Tinsel Drop**, **Snowglobe Goods**.

Logotipas: kol kas tekstinis `jolly`**`haul`** su maža auksine žvaigžde (kaip peržiūroje). Vėliau – dizaineris (Fiverr/Dribbble, $50–150).

---

## 1. Ką pardavinėti (kategorijos ir pavyzdžiai)
| Kategorija | Pavyzdžiai | Pardavimo kaina | Pastabos |
|---|---|---|---|
| Funny masks | senuko / gyvūnų / elfo slidinėjimo kaukės | $35–45 | turi savo landing puslapį |
| Star projectors | sniego / žvaigždžių projektoriai, Kalėdų senelio projektorius ant lango | $40–60 | **elektra – reikia CE/UKCA/FCC** |
| Baby & kids | elniuko, elfo, Kalėdų senelio kostiumėliai, kalėdinės pižamos | $25–40 | **vaikų saugos reikalavimai** (žr. 5 sk.) |
| Ugly sweaters | „ugly“ kalėdiniai megztiniai, poroms / šeimai | $35–55 | dydžių lentelė būtina |
| Lights & decor | lemputės užuolaidoms, šviečiantys žaisliukai, LED figūros | $20–45 | **elektra – CE** |
| Stocking stuffers | smulkūs juokingi daikčiukai, „mystery box“ | $10–25 | gerai kelia krepšelio vertę |

Taisyklė viral produktui: **(1)** suprantamas per 2 sekundes video, **(2)** „wow“ arba juoko momentas, **(3)** kaina ≥ 3× savikainos su siuntimu, **(4)** lengvas ir nedūžtantis.

---

## 2. Tiekėjai
- **CJdropshipping** (rekomenduoju) – vienas tiekėjas daugeliui kategorijų, US/EU sandėliai, galima brendinta pakuotė. Siųsk AliExpress nuorodas per „Sourcing request“.
- **DSers + AliExpress** – pigiausias startas, bet lėtesnis siuntimas.
- Kiekvienam produktui: **pirmiausia užsisakyk pavyzdį**. Patikrink kokybę, kvapą, ar elektronika turi CE ženklą ir instrukciją anglų kalba.
- Gavęs pavyzdžius – pataisyk aprašymus pagal tai, ką realiai gavai.

---

## 3. Kainodara
- Tikslas – savikaina (prekė + siuntimas) ≤ ⅓ pardavimo kainos.
- Nemokamas siuntimas nuo **$50** – skatina pirkti 2 prekes.
- Kaukėms palik „2 už −15%, 3 už −25%“ pasiūlymą (automatinės nuolaidos Shopify).
- **Perbraukta kaina** (compare-at) – tik jei tikrai pardavinėjai už tą kainą paskutines 30 d. (ES Omnibus taisyklė). Kortelėse „Save X%“ atsiranda automatiškai tik tada.

---

## 4. Shopify paruošimas
1. **Paskyra ir tema:** Shopify → Basic planas → tema **Dawn**.
2. **Įkelk failus** (Online Store → Themes → ⋯ → Edit code):
   - `Assets`: `jolly.css`, `jolly.js`
   - `Snippets`: `jolly-icon`, `jolly-art`, `jolly-card` (iš `theme/snippets/`)
   - `Sections`: `jolly-header`, `jolly-home`, `jolly-product`
   - `Templates`: pakeisk `index.json` turinį į `theme/templates/index.json`; pridėk naują `product` šabloną `landing` ir įklijuok `product.landing.json`
3. **Meniu juosta:** Online Store → Navigation → `Main menu`: 4 nuorodos (Home, Shop all, Funny masks, Gift finder → `/#jh-finder`). Tada Customize → viršuje *Header* grupėje paslėpk Dawn „Header“ ir „Announcement bar“ → *Add section* → **Jolly Haul header** → pasirink `Main menu`. Logotipas tekstinis, kol neįkelsi paveikslėlio.
4. **Kolekcijos** (Products → Collections):
   - `Trending` – rankinė, sudėk 8 geriausius → pasirink ją pradinio puslapio „Trending“ nustatyme.
   - Po vieną kolekciją kiekvienai kategorijai (Funny masks, Star projectors, Baby & kids, Ugly sweaters, Lights & decor, Stocking stuffers) → įdėk nuorodas į kategorijų plyteles.
   - Dovanų paieška pagal kainą jau nukreipta į `/collections/all?filter.v.price.lte=20` ir pan. – įjunk *Search & Discovery* app'e kainos filtrą.
5. **Produktų žymos (tags)** valdo ženkliukus kortelėse:
   - `viral` → „Viral on TikTok“, `new` → „New“.
   - Kol nėra nuotraukų: `art-projector`, `art-onesie`, `art-sweater`, `art-ornament`, `art-gift`, `art-lights`, `art-gramps`, `art-elf` – parenka iliustraciją.
6. **Kaukių produktas:** variantai `Face` (Gramps, The Cat, Tiger, Corgi, The Elf), šablonas **landing**. Kitiems produktams gali naudoti tą patį šabloną arba standartinį Dawn.
7. **Bundle nuolaidos kaukėms:** Discounts → Automatic → 15% nuo 2 vnt., 25% nuo 3 vnt. (turi sutapti su sekcijos nustatymais).
8. **Temos nustatymai, kad meniu ir krepšelis derėtų:**
   - *Colors → Scheme 1*: Background `#FFFFFF`, Text `#1B2420`, Button `#E0313F`, Button label `#FFFFFF`. *Scheme 2*: Background `#12291F`, Text `#FFFFFF`.
   - *Typography*: Headings ir Body – **Rubik**.
   - *Buttons* radius 14–16, *Inputs/Cards* radius 14.
   - *Announcement bar* išjunk – sekcijos turi savo bėgančią juostą.
9. **Programėlės:** CJdropshipping/DSers, **Judge.me** (atsiliepimai → žvaigždutės atsiras automatiškai), Shopify Email (naujienlaiškio forma jau prijungta prie klientų sąrašo su žyma `newsletter`).
10. **Prieš paleidžiant:** bandomasis užsakymas, patikrink nuolaidas, telefono vaizdą, siuntimo terminus kiekviename produkte.

Kol neįkėlei nuotraukų, visur rodomos iliustracijos. Užrašai „upload…“ matosi tik redaktoriuje.

---

## 5. Teisiniai dalykai (svarbu šiai nišai)
- **Vaikų drabužiai / kostiumėliai:** ES draudžia virvutes kapišono ir kaklo srityje (EN 14682); smulkios detalės (bumbuliukai, akys) turi būti tvirtai pritvirtintos. Kostiumai, kurie laikomi žaislais, turi turėti **CE** ženklą. Rinkis tiekėjus, kurie gali parodyti testų ataskaitas.
- **Elektronika (projektoriai, lemputės):** ES – **CE** ir instrukcija vartotojo kalba, JAV – **FCC**, JK – **UKCA**. Lauko lemputėms – IP apsaugos klasė aprašyme.
- **Netikri atsiliepimai ir netikras skubumas draudžiami** (JAV FTC, ES). Laikmatis puslapyje skaičiuoja iki **tikrų** Kalėdų – tai leidžiama.
- **AI turinys:** TikTok ir Meta reikalauja žymėti realistišką AI turinį („AI-generated“).
- **Svetimi prekės ženklai:** jokių Disney, Grinch, LEGO ir pan. personažų be licencijos.
- **Lietuvoje:** individuali veikla arba MB; ES pardavimai fiziniams asmenims > €10 000 per metus → PVM OSS.

---

## 6. Turinys ir reklama
- **Viena nuotraukų stilistika visiems produktams:** šilta kalėdinė šviesa, natūralios spalvos, be teksto ant nuotraukų. Kortelėms – kvadratas 1:1, produkto puslapiui – 1:1 galerija.
- **Video formulė (TikTok/Reels, 8–20 s):** kabliukas (0–2 s) → „wow“ ar juokas → produktas → CTA.
- **Idėjos:** projektorius įjungiamas tamsiame kambaryje („POV: your ceiling on Christmas Eve“), vaikas elniuko kostiumėlyje, senelis atidaro dovaną – kaukę, „rating Christmas gifts from TikTok“, „$20 Secret Santa that wins every time“.
- **Biudžetas:** $20–30/d. vienam produktui, 3–5 kūriniai, išjunk tuos, kurių CPA viršija pelną.
- AI nuotraukų generavimui – `imagegen/` (kie.ai), žr. README.

---

## 7. Planas iki Kalėdų
| Laikas | Darai |
|---|---|
| Spalio 1 sav. | Domenas, Shopify, failai, 6 kolekcijos, užsakai pavyzdžius (6–10 produktų) |
| Spalio 2–3 sav. | Nuotraukos ir video, organiniai įrašai kasdien, pirmos reklamos 2–3 produktams |
| Lapkritis | Didini tai, kas veikia; Black Friday (tikra akcija tik tą savaitgalį) |
| Gruodžio 1–10 d. | Paskutinis langas siuntoms iš Kinijos; po to – tik US/EU sandėlio prekės |
| Gruodžio 10–24 d. | E-dovanų kortelės, „Arrives after Christmas? Gift a card“ |

---

## 8. Failai
| Failas | Kas |
|---|---|
| `preview/index.html` | Pradinio puslapio peržiūra |
| `preview/product.html` | Produkto (kaukių) puslapio peržiūra |
| `theme/sections/jolly-header.liquid` | Meniu juosta (logotipas kairėje, meniu centre, piktogramos dešinėje; telefone – išskleidžiamas meniu) |
| `theme/sections/jolly-home.liquid` | Pradinis puslapis (hero, kategorijos, trending, laikmatis, spotlight, dovanų paieška, DUK, naujienlaiškis) |
| `theme/sections/jolly-product.liquid` | Produkto landing puslapis |
| `theme/snippets/jolly-card.liquid` | Produkto kortelė tinkleliuose |
| `theme/snippets/jolly-art.liquid` | Iliustracijos vietoje nuotraukų |
| `theme/snippets/jolly-icon.liquid` | Piktogramos |
| `theme/templates/index.json`, `product.landing.json` | Užpildyti šablonai |
| `docs/PRODUCT_COPY_EN.md` | Angliški tekstai |
| `preview/build.mjs` | Peržiūrų generatorius (`cd preview && npm install && npm run build`) |
