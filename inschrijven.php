<?php
// Verwerkt het inschrijfformulier op lid-worden.html en mailt het naar de ledenadministratie.
// Werkt alleen op de webhosting (PHP), niet op de testversie op GitHub Pages.

$ontvanger = 'ledenadministratie@bvgaasperdam.nl';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: lid-worden.html#inschrijven');
    exit;
}

// Spam-val: dit veld is onzichtbaar, mensen laten het leeg.
if (!empty($_POST['website'])) {
    header('Location: bedankt.html');
    exit;
}

function veld($naam) {
    $waarde = trim($_POST[$naam] ?? '');
    return str_replace(["\r", "\n"], ' ', $waarde);
}

$voornaam     = veld('voornaam');
$achternaam   = veld('achternaam');
$email        = filter_var(veld('email'), FILTER_VALIDATE_EMAIL);
$geboorte     = veld('geboortedatum');
$lidmaatschap = veld('lidmaatschap');
$opmerking    = trim($_POST['opmerking'] ?? '');

if ($voornaam === '' || $achternaam === '' || !$email || $geboorte === '' || $lidmaatschap === '' || empty($_POST['akkoord'])) {
    http_response_code(400);
    echo 'Niet alle verplichte velden zijn ingevuld. Ga terug en probeer het opnieuw.';
    exit;
}

$tekst = "Nieuwe inschrijving via de website\n\n"
       . "Naam: $voornaam $achternaam\n"
       . "E-mail: $email\n"
       . "Geboortedatum: $geboorte\n"
       . "Lidmaatschap: $lidmaatschap\n"
       . "Opmerking: $opmerking\n";

$headers = "From: website@bvgaasperdam.nl\r\n"
         . "Reply-To: $email\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

$gelukt = mail($ontvanger, "Inschrijving: $voornaam $achternaam", $tekst, $headers);

$map = (($_POST['taal'] ?? '') === 'en') ? 'en/' : '';
header('Location: ' . $map . ($gelukt ? 'bedankt.html' : 'lid-worden.html?fout=1#inschrijven'));
