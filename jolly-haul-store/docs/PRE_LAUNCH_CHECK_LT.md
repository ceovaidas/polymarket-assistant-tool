# Jolly Haul — patikrinimas prieš paleidimą

Šis sąrašas — ką reikia padaryti ir patikrinti prieš pradedant priimti tikrus užsakymus. Pažymėta **✅ jau padaryta** — tai sutvarkyta per Shopify API; **☐** — reikia padaryti tau Shopify administravime (prie šių nustatymų API prieigos nėra).

---

## 1. Kas jau sutvarkyta ✅

| Sritis | Būsena |
|---|---|
| Prekės | 8 aktyvios prekės: angliški pavadinimai ir aprašymai, SEO, kainos ≥ savikaina × 2, be netikrų „perbrauktų“ kainų |
| Sandėlis | Visiems 99 variantams įjungta „neparduoti, kai baigiasi“ — išparduota prekė rodoma kaip *Sold out*, o ne užsakoma be atsargų |
| Kolekcijos | 12 automatinių kolekcijų (pagal žymas ir kainą), visos paskelbtos |
| Nuolaidos | Mix & match (2 = −10 %, 3+ = −15 %), kaukių paketai (−15 % / −25 %), 6 rato kodai. Procentinės nuolaidos nesideda viena ant kitos |
| Pristatymas | 42 šalys (visa ES ir EEE, JAV, JK, Kanada, Australija, NZ, Šveicarija, Japonija, Korėja, Singapūras, Honkongas, Malaizija, JAE, Izraelis): $4.99, nemokamai nuo $50 |
| Rinkos | Sukurta rinka **International** (41 šalis) su vietinėmis valiutomis (EUR, GBP, CAD, AUD ir kt. — iš viso 21 valiuta). Anksčiau buvo aktyvi tik Lietuva, todėl kitų šalių pirkėjai greičiausiai nebūtų galėję apmokėti |
| Puslapiai | Shipping, Returns & refunds, FAQ, About us, Contact (su forma) |
| Meniu | Pagrindinis ir poraštės meniu veda į esamus puslapius |
| Tema | Visi puslapiai patikrinti 5 ekrano pločiuose (320–1440 px), Theme Check klaidų mūsų failuose nėra |

---

## 2. Būtina padaryti prieš paleidimą ☐

### 2.1 Parduotuvės pavadinimas ir laiko juosta
**Settings → General**
- ☐ *Store name*: `My Store` → **Jolly Haul**. Šis vardas rodomas pirkėjams siunčiamuose el. laiškuose, naršyklės skirtuke ir taisyklėse.
- ☐ *Time zone*: dabar **(GMT-05:00) Eastern Time / New York** → **(GMT+02:00) Vilnius**. Pagal ją rodomas užsakymų laikas ir prasideda bei baigiasi nuolaidos.
- ☐ *Sender email*: užuot naudoję asmeninį Gmail, geriau susikurkite atskirą el. paštą parduotuvei (pvz. `hello@jollyhaul.shop`, kai turėsite domeną). Kol kas tinka ir Gmail.

### 2.2 Taisyklės (teisiškai būtinos)
**Settings → Policies**
- ☐ **Refund policy** ir **Shipping policy**: įklijuokite tekstus iš `docs/POLICIES_EN.md`.
- ☐ **Terms of service**: *Create from template*, tada visur „My Store“ pakeiskite į „Jolly Haul“.
- ☐ **Contact information**: užpildykite (vardas ir pavardė arba įmonė, adresas, el. paštas). ES tai privaloma.
- ☐ **Privacy policy**: pakeitę parduotuvės pavadinimą, spauskite *Create from template* iš naujo, nes dabartiniame tekste vis dar parašyta „My Store“.

### 2.3 Domenas
**Settings → Domains → Buy new domain** (laisvi, patikrinta):
- `jollyhaul.shop`: $10/metams (rekomenduoju)
- `jollyhaul.store`: $9/metams
- (`jollyhaul.com` užimtas)

Be savo domeno adresas lieka `mnvw5c-gf.myshopify.com`. Pirkėjams jis atrodo nepatikimas, o reklamos platformos tokius adresus dažniau blokuoja.

### 2.4 Mokėjimai
**Settings → Payments**
- ☐ Patikrinkite, ar aktyvuoti **Shopify Payments** (kortelės, Apple Pay, Google Pay). Jei Lietuvoje nepasiekiami, įjunkite **PayPal**, o kortelėms – **Stripe** arba kitą siūlomą tiekėją.
- ☐ Įjunkite **PayPal Express**: daug pirkėjų užsienyje jį naudoja.
- ☐ *Payout* (išmokų) sąskaita: įveskite savo banko sąskaitą.

### 2.5 El. laiškų dizainas
**Settings → Notifications → Customize email templates** (arba *Branding*):
- ☐ Įkelkite logotipą (plotis ~200 px).
- ☐ *Accent color*: `#E0313F` (raudona kaip svetainėje).
- ☐ Peržiūrėkite šiuos laiškus (*Preview*):
  - **Order confirmation**: užsakymo patvirtinimas;
  - **Shipping confirmation**: išsiųsta, su sekimo nuoroda;
  - **Shipping update**: pasikeitė siuntos informacija;
  - **Order canceled**, **Order refund**: atšaukimas ir pinigų grąžinimas;
  - **Abandoned checkout**: priminimas paliktam krepšeliui. Įjunkite automatinį siuntimą po **10 val.**, nes tai grąžina 5–10 % pirkėjų.
- ☐ Laiške *Order confirmation* turi būti teisingas pavadinimas „Jolly Haul“ (tai priklauso nuo 2.1 žingsnio).

### 2.6 Tiekėjo programėlė (DSers ar kita)
- ☐ Išjunkite **automatinį kainų sinchronizavimą** (*price sync*), kitaip programėlė perrašys kainas savikaina. Arba nustatykite taisyklę „savikaina × 2,5, apvalinti iki .99“.
- ☐ Palikite įjungtą **atsargų sinchronizavimą**: kartu su „neparduoti, kai baigiasi“ tai apsaugo nuo išparduotų prekių užsakymų.
- ☐ Patikrinkite, kiek kainuoja **siuntimas iš Kinijos** į JAV ir ES kiekvienai prekei, ir rinkitės AliExpress Standard / Choice (7–15 d.).
- ☐ **Sekimo numeriai**: įjunkite, kad programėlė automatiškai juos perkeltų į Shopify. Tada pirkėjas gauna laišką *Shipping confirmation*.

---

## 3. Bandomasis pirkimas (rekomenduoju 2 kartus)

> Tikru pinigu mokėti nereikia: Shopify turi bandomąjį režimą.

**A. Įjunkite bandomąjį režimą**
1. **Settings → Payments → Shopify Payments → Manage → Test mode** → įjunkite.
   - Jei Shopify Payments neturite: **Settings → Payments → Add payment method → (for testing) Bogus Gateway**.
2. Išsaugokite.

**B. Pirkite kaip klientas** (geriausia telefone, privačiame naršyklės lange)
1. Atsidarykite parduotuvę ir įdėkite **2 skirtingas prekes** (patikrinsite Mix & match −10 %).
2. Krepšelyje patikrinkite:
   - ar matosi nemokamo pristatymo juosta;
   - ar matosi Mix & match priminimas;
   - ar galima įrašyti dovanos žinutę.
3. *Check out* → įveskite **savo Gmail** ir JAV adresą (pvz. *350 5th Ave, New York, NY 10118*). Tada patikrinsite tarptautinį pirkėją ir valiutą.
4. Apmokėkite:
   - **Shopify Payments test mode:** kortelė `4242 4242 4242 4242`, bet kokia ateities data, CVC `123`.
   - **Bogus Gateway:** kortelės numeris `1` (sėkmingas mokėjimas).
5. Antrą kartą pakartokite su **3 kaukėmis su skirtingais veidais** ir rato kodu, pvz. `JOLLY10`. Patikrinkite, kad buvo pritaikyta tik viena, didesnė nuolaida (−25 %).

**C. Ką turite gauti ir patikrinti**
| Kur | Ką tikrinti |
|---|---|
| Padėkos puslapis po apmokėjimo | Užsakymo numeris, prekės, suma, adresas |
| Gmail: **Order confirmation** (per 1–2 min.; žiūrėkite ir *Spam*, *Promotions*) | Siuntėjas „Jolly Haul“, logotipas, prekės ir variantai (veidas, dydis), nuolaida, pristatymas, suma |
| Shopify → **Orders** | Užsakymas pažymėtas *Test*, matosi pirkėjo pastaba |
| Tiekėjo programėlė | Užsakymas matosi, bet **NEAPMOKĖKITE** jo tiekėjui |
| Shopify → užsakymas → *Fulfill* su bet kokiu sekimo numeriu | Gmail: ar atėjo **Shipping confirmation** su sekimo nuoroda |

**D. Po testo**
1. Užsakymą atšaukite (**Cancel order**) ir suarchyvuokite. Tiekėjo programėlėje taip pat atšaukite.
2. **Išjunkite Test mode** arba Bogus Gateway. **Svarbu:** kol jis įjungtas, tikri pirkėjai negali sumokėti!

---

## 4. Verslo ir teisės klausimai (Lietuva)

- ☐ **Veiklos forma**: prekybai reikia individualios veiklos pažymos arba MB / UAB. Shopify ir mokėjimų tiekėjai gali paprašyti šių duomenų.
- ☐ **PVM**: kol pardavimai ES neviršija €45 000 per metus, mokėti PVM nereikia. Kai ES pardavimai kitoms šalims viršija €10 000, reikia registruotis **OSS** sistemoje. Pasitarkite su buhalteriu.
- ☐ **Muitai**:
  - Siuntos iš Kinijos į ES apmokestinamos PVM nuo pirmo euro.
  - JAV nuo 2025 m. rugpjūčio panaikino $800 neapmokestinamą ribą, todėl muitai taikomi visoms siuntoms. AliExpress Choice dažnai įskaičiuoja muitą į kainą, bet patikrinkite kiekvienai prekei pas tiekėją. Jei pirkėjas turės primokėti kurjeriui, jis greičiausiai užsakymą atmes.
  - Taisyklėse jau parašyta, kad muitus moka gavėjas. Vis dėlto geriausia rinktis tiekėjus, kurie pristato su sumokėtais muitais (*DDP / tax included*).
- ☐ **Prekių ženklai**: Disney, Bandai ir kitų personažų (Stitch ir pan.) neminėkite pavadinimuose ar reklamose.

---

## 5. Po paleidimo: kas savaitę

- Peržiūrėkite naujus užsakymus ir ar visi perduoti tiekėjui.
- Atsakykite į laiškus per 24–48 val.
- Patikrinkite sekimo numerius: ar visi užsakymai išsiųsti per 3 d.
- **Analytics → Reports**: kurios prekės parduodamos, iš kokių šalių pirkėjai.
- Pridėdami naujas prekes, sutvarkykite: kainą (savikaina × 2,5), kategorijos žymą (`cat-...`), pavadinimą ir aprašymą.
