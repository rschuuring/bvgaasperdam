# Beheer van de website BV Gaasperdam

Deze handleiding is bedoeld voor wie de website bijhoudt of overneemt. Lees hem eerst door voordat je iets aanpast. Je kunt hem ook aan een AI-assistent geven als startpunt.

## Hoe de site in elkaar zit

De site bestaat uit gewone HTML-bestanden, zonder WordPress en zonder database. Er hoeft niets te worden bijgewerkt of geïnstalleerd.

| Bestand | Wat staat erop |
| --- | --- |
| `index.html` | Homepage: welkom, speelschema, laatste nieuws, locatie |
| `spelen.html` | Speeltijden, proefspelen, wat neem je mee |
| `lid-worden.html` | Contributietabel, opzeggen, blessures, inschrijfformulier |
| `competitie.html` | Teamindeling van dit seizoen en links naar uitslagen en standen |
| `jeugd.html` | Jeugdtraining, aanmelden, jeugdfonds |
| `nieuws.html` | Alle nieuwsberichten, nieuwste bovenaan |
| `vereniging.html` | Bestuur, gedragsregels, privacy, sponsors |
| `privacy.html` | Privacyverklaring |
| `sponsorkliks.html` | SponsorKliks-webwinkels (ingebouwd van sponsorkliks.com) en BeeS-Sport |
| `gedrag.html` | Wat te doen bij grensoverschrijdend gedrag, vertrouwenspersoon |
| `contact.html` | E-mailadressen per onderwerp |
| `welcome.html` | Stuurt de oude Engelse link door naar `en/index.html` |
| `bedankt.html` | Bevestiging na het inschrijfformulier (alleen als JavaScript uit staat) |
| `inschrijven.php` | Mailt het inschrijfformulier met de PDF als bijlage naar de ledenadministratie (werkt alleen op de webhosting) |
| `assets/inschrijven.js` | Het inschrijfformulier: velden per soort (recreant, competitie, jeugd), handtekening, PDF maken en versturen |
| `assets/jspdf.umd.min.js` | Bibliotheek die de PDF maakt (jsPDF 2.5.1, MIT-licentie). Niet aanpassen. |
| `docs/` | Statuten en huishoudelijk reglement (PDF), gelinkt vanaf `vereniging.html` en het inschrijfformulier |
| `assets/style.css` | Kleuren, lettertypes en opmaak van de hele site. Verhoog na een wijziging het nummer in `style.css?v=…` op alle pagina's, anders zien bezoekers de oude opmaak uit hun browsergeheugen. |
| `assets/site.js` | Het menu op de telefoon |

De Engelse versie staat in de map `en/`, met dezelfde bestandsnamen (bijvoorbeeld `en/spelen.html`). Rechtsboven wissel je met NL/EN tussen de twee. **Pas je iets aan op een Nederlandse pagina, pas dan ook de Engelse pagina in `en/` aan.** `welcome.html` stuurt oude links door naar `en/index.html`.

Het menu, de kop en de voettekst staan op elke pagina. Pas je het menu aan, doe dat dan in alle HTML-bestanden, ook die in `en/`.

## Veelvoorkomende aanpassingen

- **Nieuwsbericht toevoegen:** zet een nieuw `<article>` bovenaan in `nieuws.html`, en vervang op `index.html` het oudste van de twee berichten onder "Laatste nieuws".
- **Speeltijden wijzigen:** het schema staat op `index.html` en `spelen.html`, en in het Engels op `en/index.html` en `en/spelen.html`. Pas alle vier aan.
- **Nieuw seizoen:** werk op `competitie.html` de teamindeling (één `<div class="team">` per team), de links naar toernooi.nl en het seizoen in de kop bij. Pas ook de teamkeuze in het inschrijfformulier aan (`<select name="team">` op `lid-worden.html`).
- **Contributie:** pas de tabel op `lid-worden.html` aan, met de datum van de ALV.
- **Bestuur:** pas de tabel op `vereniging.html` aan.
- **Links naar andere websites** openen in een nieuw venster: geef ze `target="_blank" rel="noopener"` mee.

## Testversie en echte site

- **Testversie:** GitHub Pages, vanuit deze repository. Elke wijziging op de `main`-branch staat binnen een paar minuten online.
- **Echte site:** www.bvgaasperdam.nl, op de webhosting van de club. Daar draait nu (oktober 2026) nog de oude WordPress-site.

In de repository staat op elke pagina `<meta name="robots" content="noindex, nofollow">` en blokkeert `robots.txt` zoekmachines, zodat de testversie niet in Google komt. `tools/maak_upload.py` haalt dat weg voor de echte site.

## Live zetten op de webhosting

De webhosting is bHosted (pakket met DirectAdmin). Inloggen op DirectAdmin gaat via het adres van de server (in oktober 2026 https://s13.servitnow.nl:2222) met de hostinglogin van het bestuur.

1. Maak het uploadbestand: `python3 tools/maak_upload.py`. Dat maakt `bvgaasperdam-upload-<datum>.zip` zonder de testmodus (noindex en robots.txt), met een `.htaccess` die oude WordPress-adressen doorstuurt. BEHEER.md, README.md en `tools/` gaan niet mee.
2. Eerste keer (oktober 2026): oude WordPress-bestanden uit `public_html` verplaatst naar `domains/bvgaasperdam.nl/oud-wordpress` (buiten de website), na een volledige backup via "Create/Restore Backups".
3. Upload de zip in DirectAdmin > File Manager naar `public_html`, pak hem uit (Extract) en verwijder de zip. Bestaande bestanden worden overschreven.
4. Test het inschrijfformulier één keer en controleer of de mail met de PDF-bijlage bij de ledenadministratie aankomt.

Na een wijziging alleen de gewijzigde bestanden uploaden mag ook, maar let op: HTML-bestanden uit de repository bevatten de noindex-regel. Gebruik daarom altijd de zip uit stap 1.

## Afspraken en keuzes

- Oktober 2026: de oude WordPress-site (PHP 7.4, verouderde plugins) is vervangen door deze eenvoudige site, zodat er geen onderhoud aan WordPress meer nodig is.
- Kleuren: clubgroen (#136153) uit het logo, donkergroen (#0d4a3f) voor de kopbalk en mint (#a7dcc0) voor knoppen en labels. Gekozen door Robert in oktober 2026 (blauw paste niet goed bij het groen). Logo's: `assets/logo.png` (150x150, van de oude site) en `assets/bees-sport.png`. Een groter of vectorbestand van het clublogo maakt de homepage scherper.
- Oktober 2026: het inschrijfformulier volgt de drie papieren formulieren van het bestuur (recreanten, competitie, jeugd) in één formulier: je kiest bovenaan de soort en krijgt de juiste velden. Online invullen en tekenen, als PDF downloaden, of een leeg formulier printen. De ledenadministratie krijgt een mail met de gegevens en het ondertekende formulier als PDF. De PDF is altijd in het Nederlands.
- Oude nieuwsberichten van de WordPress-site (2010–2022) zijn niet overgenomen.

## Toegang

Wachtwoorden en inloggegevens horen **niet** in deze repository. Het bestuur bewaart de inlog voor de hosting, het domein en het GitHub-account apart.
