"""Maakt het zip-bestand om de site op de webhosting (www.bvgaasperdam.nl) te zetten.

Gebruik:  python3 tools/maak_upload.py [map-voor-de-zip]

De repository is de testversie (GitHub Pages) en blokkeert zoekmachines. Dit script zet een kopie klaar
voor de echte site: zonder de noindex-regels, met een robots.txt die zoekmachines toelaat en met een
.htaccess die oude WordPress-adressen doorstuurt. BEHEER.md, README.md en deze map gaan niet mee.
"""
import datetime
import pathlib
import re
import subprocess
import sys
import zipfile

REPO = pathlib.Path(__file__).resolve().parent.parent
NIET_MEE = {"BEHEER.md", "README.md", "robots.txt"}

ROBOTS = "User-agent: *\nDisallow:\n"

# Oude WordPress-adressen (uit de sitemap van oktober 2026) en waar ze nu staan.
DOORSTUREN = [
    ("informatie/informatie", "/lid-worden.html"),
    ("informatie/contributie-kosten", "/lid-worden.html"),
    ("informatie/overzicht-speeldagen", "/spelen.html"),
    ("informatie/privacyverklaring", "/privacy.html"),
    ("informatie/bestuur-bv-gaasperdam", "/vereniging.html"),
    ("informatie/wat-te-doen-bij-grensoverschrijdend-gedrag", "/gedrag.html"),
    ("informatie", "/lid-worden.html"),
    ("inschrijfformulier", "/lid-worden.html#inschrijven"),
    ("teamindeling", "/competitie.html#teamindeling"),
    ("corona-maatregelen-competitiewedstrijden", "/competitie.html"),
    ("jeugd(/.*)?", "/jeugd.html"),
    ("sponsorkliks-2", "/sponsorkliks.html"),
    ("contact-2", "/contact.html"),
    ("welcome", "/en/index.html"),
    ("agenda", "/"),
    ("fotoalbum-2", "/"),
]

HTACCESS_KOP = """# BV Gaasperdam: eenvoudige site zonder WordPress (oktober 2026).
# Gemaakt door tools/maak_upload.py in de GitHub-repository; pas het daar aan.
DirectoryIndex index.html
Options -Indexes

RewriteEngine On

# Altijd via https://www.bvgaasperdam.nl
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} !^www\\. [NC]
RewriteRule ^ https://www.bvgaasperdam.nl%{REQUEST_URI} [R=301,L,NE]

# Statuten en huishoudelijk reglement op hun oude adres
RewriteRule ^wp-content/uploads/2011/12/(BVG_Statuten|BVG_Huishoudelijk_Reglement)\\.pdf$ /docs/$1.pdf [R=301,L]

# Oude pagina's van de WordPress-site
"""

HTACCESS_STAART = """
# Oude nieuwsberichten (/2019/05/titel/) naar de nieuwspagina
RewriteRule ^\\d{4}/\\d{2}/ /nieuws.html [R=301,L]

# Overige WordPress-adressen naar de homepage
RewriteRule ^(wp-admin|wp-login\\.php|wp-content|wp-includes|xmlrpc\\.php|feed|category|tag|author|comments)(/|$) / [R=301,L]
RewriteCond %{QUERY_STRING} (^|&)(p|page_id|cat)=\\d+
RewriteRule ^$ /? [R=301,L]
"""


def htaccess():
    regels = [f"RewriteRule ^{oud}/?$ {nieuw} [R=301,L,NE,NC]" for oud, nieuw in DOORSTUREN]
    return HTACCESS_KOP + "\n".join(regels) + "\n" + HTACCESS_STAART


def live(html):
    html = re.sub(r"[ \t]*<!-- TESTVERSIE:[^>]*-->\n", "", html)
    return re.sub(r'[ \t]*<meta name="robots" content="noindex, nofollow">\n', "", html)


def schrijf(z, naam, inhoud):
    # Leesbaar voor de webserver (644); anders geeft de hosting "403 Forbidden".
    info = zipfile.ZipInfo(naam, date_time=datetime.datetime.now().timetuple()[:6])
    info.external_attr = 0o100644 << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    z.writestr(info, inhoud)


def main():
    uit = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    bestanden = subprocess.run(["git", "ls-files"], cwd=REPO, capture_output=True, text=True, check=True).stdout.split()
    zipnaam = uit / f"bvgaasperdam-upload-{datetime.date.today():%Y-%m-%d}.zip"
    with zipfile.ZipFile(zipnaam, "w", zipfile.ZIP_DEFLATED) as z:
        for naam in bestanden:
            if naam in NIET_MEE or naam.startswith("tools/") or naam.startswith("."):
                continue
            pad = REPO / naam
            if naam.endswith(".html"):
                tekst = live(pad.read_text(encoding="utf-8"))
                if "noindex" in tekst and naam != "welcome.html":
                    sys.exit(f"noindex niet weggehaald in {naam}")
                schrijf(z, naam, tekst)
            else:
                schrijf(z, naam, pad.read_bytes())
        schrijf(z, "robots.txt", ROBOTS)
        schrijf(z, ".htaccess", htaccess())
    print(zipnaam)


if __name__ == "__main__":
    main()
