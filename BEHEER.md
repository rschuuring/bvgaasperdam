# Beheer van de website BV Gaasperdam

Deze handleiding is bedoeld voor wie de website bijhoudt of overneemt. Lees hem eerst door voordat je iets aanpast. Je kunt hem ook aan een AI-assistent geven als startpunt.

## Hoe de site in elkaar zit

De site bestaat uit gewone HTML-bestanden, zonder WordPress en zonder database. Er hoeft niets te worden bijgewerkt of geïnstalleerd.

| Bestand | Wat staat erop |
| --- | --- |
| `index.html` | Homepage: welkom, speelschema, laatste nieuws, locatie |
| `spelen.html` | Speeltijden, proefspelen, wat neem je mee |
| `lid-worden.html` | Contributietabel, opzeggen, blessures, inschrijfformulier |
| `competitie.html` | Teams van dit seizoen met links naar uitslagen en standen |
| `jeugd.html` | Jeugdtraining, aanmelden, jeugdfonds |
| `nieuws.html` | Alle nieuwsberichten, nieuwste bovenaan |
| `vereniging.html` | Bestuur, gedragsregels, privacy, sponsors |
| `privacy.html` | Privacyverklaring |
| `sponsorkliks.html` | SponsorKliks-webwinkels (ingebouwd van sponsorkliks.com) en BeeS-Sport |
| `gedrag.html` | Wat te doen bij grensoverschrijdend gedrag, vertrouwenspersoon |
| `contact.html` | E-mailadressen per onderwerp |
| `welcome.html` | Engelse pagina |
| `bedankt.html` | Bevestiging na het inschrijfformulier |
| `inschrijven.php` | Mailt het inschrijfformulier naar de ledenadministratie (werkt alleen op de webhosting) |
| `assets/style.css` | Kleuren, lettertypes en opmaak van de hele site |
| `assets/site.js` | Het menu op de telefoon |

De Engelse versie staat in de map `en/`, met dezelfde bestandsnamen (bijvoorbeeld `en/spelen.html`). Rechtsboven wissel je met NL/EN tussen de twee. **Pas je iets aan op een Nederlandse pagina, pas dan ook de Engelse pagina in `en/` aan.** `welcome.html` stuurt oude links door naar `en/index.html`.

Het menu, de kop en de voettekst staan op elke pagina. Pas je het menu aan, doe dat dan in alle HTML-bestanden, ook die in `en/`.

## Veelvoorkomende aanpassingen

- **Nieuwsbericht toevoegen:** zet een nieuw `<article>` bovenaan in `nieuws.html`, en vervang op `index.html` het oudste van de twee berichten onder "Laatste nieuws".
- **Speeltijden wijzigen:** het schema staat op `index.html` en `spelen.html` (en in het Engels op `welcome.html`). Pas alle drie aan.
- **Nieuw seizoen:** werk op `competitie.html` de teams en links naar toernooi.nl bij en pas het seizoen in de kop aan.
- **Contributie:** pas de tabel op `lid-worden.html` aan, met de datum van de ALV.
- **Bestuur:** pas de tabel op `vereniging.html` aan.
- **Links naar andere websites** openen in een nieuw venster: geef ze `target="_blank" rel="noopener"` mee.

## Testversie en echte site

- **Testversie:** GitHub Pages, vanuit deze repository. Elke wijziging op de `main`-branch staat binnen een paar minuten online.
- **Echte site:** www.bvgaasperdam.nl, op de webhosting van de club. Daar draait nu (oktober 2026) nog de oude WordPress-site.

Zolang dit een testversie is, staat op elke pagina `<meta name="robots" content="noindex, nofollow">` en blokkeert `robots.txt` zoekmachines. **Haal die regel en `robots.txt` weg wanneer de site live gaat op bvgaasperdam.nl.**

## Live zetten op de webhosting

1. Maak een back-up van de oude WordPress-site via het hostingpaneel.
2. Upload alle bestanden uit deze repository (behalve `BEHEER.md` en `README.md`) naar de webmap van bvgaasperdam.nl, meestal `public_html`.
3. Haal de noindex-regel en `robots.txt` weg (zie hierboven).
4. Test het inschrijfformulier één keer en controleer of de mail bij de ledenadministratie aankomt.

## Afspraken en keuzes

- Oktober 2026: de oude WordPress-site (PHP 7.4, verouderde plugins) is vervangen door deze eenvoudige site, zodat er geen onderhoud aan WordPress meer nodig is.
- Kleuren: clubgroen (#136153) uit het logo, donkergroen (#0d4a3f) voor de kopbalk en mint (#a7dcc0) voor knoppen en labels. Gekozen door Robert in oktober 2026 (blauw paste niet goed bij het groen). Logo's: `assets/logo.png` (150x150, van de oude site) en `assets/bees-sport.png`. Een groter of vectorbestand van het clublogo maakt de homepage scherper.
- Oude nieuwsberichten van de WordPress-site (2010–2022) zijn niet overgenomen.

## Toegang

Wachtwoorden en inloggegevens horen **niet** in deze repository. Het bestuur bewaart de inlog voor de hosting, het domein en het GitHub-account apart.
