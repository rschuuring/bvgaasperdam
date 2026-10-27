<?php
// Verwerkt het inschrijfformulier op lid-worden.html en mailt het naar de ledenadministratie,
// met de ingevulde gegevens in de mail en het formulier als PDF-bijlage.
// Werkt alleen op de webhosting (PHP), niet op de testversie op GitHub Pages.

// Voor het geval de hosting de mbstring-uitbreiding van PHP niet heeft.
if (!function_exists('mb_substr')) {
    function mb_substr($s, $start, $len) { return substr($s, $start, $len); }
}

$ontvanger = 'ledenadministratie@bvgaasperdam.nl';
$afzender  = 'website@bvgaasperdam.nl';

$viaScript = ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';
$map = (($_POST['taal'] ?? '') === 'en') ? 'en/' : '';

// Antwoord voor de pagina: JSON als het formulier via JavaScript is verstuurd, anders een doorverwijzing.
function klaar($gelukt, $fout = '') {
    global $viaScript, $map;
    if ($viaScript) {
        header('Content-Type: application/json; charset=UTF-8');
        if (!$gelukt) http_response_code($fout === 'mail' ? 500 : 400);
        echo json_encode(['ok' => $gelukt, 'fout' => $fout]);
    } else {
        header('Location: ' . $map . ($gelukt ? 'bedankt.html' : 'lid-worden.html?fout=1#inschrijven'));
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: lid-worden.html#inschrijven');
    exit;
}

// Te groot verzoek: PHP gooit dan alle velden weg.
if (empty($_POST) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) klaar(false, 'te groot');

// Spam-val: dit veld is onzichtbaar, mensen laten het leeg.
if (!empty($_POST['website'])) klaar(true);

function veld($naam) {
    $waarde = $_POST[$naam] ?? '';
    if (is_array($waarde)) $waarde = implode(', ', $waarde);
    return trim(str_replace(["\r", "\n"], ' ', mb_substr((string)$waarde, 0, 300)));
}

$soorten = ['recreant' => 'Recreant', 'competitie' => 'Competitie', 'jeugd' => 'Jeugd'];
$soort = veld('soort');
if (!isset($soorten[$soort])) klaar(false, 'veld soort');

// Velden per soort, in de volgorde van het papieren formulier: veldnaam => [omschrijving, verplicht].
$velden = [
    'voornaam'      => ['Voornaam', true],
    'achternaam'    => ['Achternaam', true],
    'geslacht'      => ['Geslacht', true],
    'geboortedatum' => ['Geboortedatum', true],
    'adres'         => ['Adres', true],
    'postcode'      => ['Postcode', true],
    'woonplaats'    => ['Woonplaats', true],
    'telefoon'      => ['Telefoon', true],
    'email'         => ['E-mail', true],
];
if ($soort === 'recreant') {
    $velden['speelavond'] = ['Voorkeur speelavond', false];
} elseif ($soort === 'competitie') {
    $velden['team'] = ['Welk team', true];
    $velden['speelavond_comp'] = ['Speelavond', false];
} else {
    $velden['telefoon_ouder'] = ['Telefoon ouder/verzorger', true];
    $velden['naam_ouder'] = ['Naam ouder/verzorger', true];
    $velden['betaling'] = ['Contributie', true];
}
if ($soort !== 'jeugd' || veld('betaling') === 'iban') $velden['iban'] = ['IBAN', true];
if ($soort === 'jeugd' && veld('betaling') === 'stadspas') $velden['stadspas'] = ['Stadspasnummer', true];
$velden['datum'] = [$soort === 'jeugd' ? 'Datum lidmaatschap' : 'Datum van inschrijving', true];

$regels = [];
foreach ($velden as $naam => [$omschrijving, $verplicht]) {
    $waarde = veld($naam);
    if ($verplicht && $waarde === '') klaar(false, "veld $naam");
    if ($naam === 'betaling') $waarde = $waarde === 'stadspas' ? 'via de Stadspas' : 'betaalt zelf (IBAN)';
    if ($naam === 'stadspas') $waarde = '6064 3660 110 ' . $waarde;
    if ($naam === 'iban') $waarde = strtoupper(str_replace(' ', '', $waarde));
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $waarde, $d)) $waarde = "$d[3]-$d[2]-$d[1]";
    $regels[] = str_pad($omschrijving . ':', 28) . $waarde;
}
// Alleen een ruwe controle: de browser controleert het adres al. Reply-To alleen bij een geldig adres.
$email = str_replace([' ', ',', ';', '<', '>'], '', veld('email'));
if (strpos($email, '@') === false) klaar(false, 'veld email');
$antwoordAan = filter_var($email, FILTER_VALIDATE_EMAIL) ? "Reply-To: $email\r\n" : '';
if (empty($_POST['akkoord'])) klaar(false, 'veld akkoord');

$opmerking = trim(mb_substr((string)($_POST['opmerking'] ?? ''), 0, 2000));
$naam = veld('voornaam') . ' ' . veld('achternaam');

$tekst = "Nieuwe inschrijving via de website: " . $soorten[$soort] . "\n\n"
       . implode("\n", $regels) . "\n"
       . ($opmerking !== '' ? "\nOpmerking:\n$opmerking\n" : '')
       . "\nAkkoord met statuten, huishoudelijk reglement, privacyverklaring en opzegregels: ja\n"
       . "Het ingevulde en ondertekende formulier zit als PDF in de bijlage.\n";

// PDF uit het formulier controleren: moet echt een PDF zijn en niet te groot.
$pdf = '';
if (($_FILES['pdf']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK && $_FILES['pdf']['size'] <= 3 * 1024 * 1024) {
    $pdf = file_get_contents($_FILES['pdf']['tmp_name']);
} elseif (!empty($_POST['pdf'])) {
    $pdf = (string)base64_decode((string)$_POST['pdf'], true);
}
if (substr($pdf, 0, 5) !== '%PDF-' || strlen($pdf) > 3 * 1024 * 1024) $pdf = '';

$onderwerp = '=?UTF-8?B?' . base64_encode("Inschrijving {$soorten[$soort]}: $naam") . '?=';
$headers = "From: BV Gaasperdam website <$afzender>\r\n"
         . $antwoordAan
         . "MIME-Version: 1.0\r\n";

if ($pdf === '') {
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";
    $bericht = str_replace('Het ingevulde en ondertekende formulier zit als PDF in de bijlage.', '(Geen PDF meegestuurd.)', $tekst);
} else {
    $grens = 'bvg' . bin2hex(random_bytes(12));
    $bestand = preg_replace('/[^A-Za-z0-9 _.-]/', '', "Inschrijving $naam") . '.pdf';
    $headers .= "Content-Type: multipart/mixed; boundary=\"$grens\"\r\n";
    $bericht = "--$grens\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n"
             . $tekst . "\r\n"
             . "--$grens\r\n"
             . "Content-Type: application/pdf; name=\"$bestand\"\r\n"
             . "Content-Transfer-Encoding: base64\r\n"
             . "Content-Disposition: attachment; filename=\"$bestand\"\r\n\r\n"
             . chunk_split(base64_encode($pdf)) . "\r\n"
             . "--$grens--\r\n";
}

klaar(mail($ontvanger, $onderwerp, $bericht, $headers) ? true : false, 'mail');
