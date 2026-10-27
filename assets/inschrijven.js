// Inschrijfformulier op lid-worden.html en en/lid-worden.html.
// Toont de juiste velden per soort lidmaatschap (recreant, competitie, jeugd),
// maakt van de ingevulde gegevens een PDF (jsPDF) en verstuurt die met het formulier naar inschrijven.php.
// De PDF is altijd in het Nederlands: het is het formulier voor de ledenadministratie.

(() => {
  const form = document.getElementById("signup");
  if (!form) return;

  const EN = document.documentElement.lang === "en";
  const tekst = (nl, en) => (EN ? en : nl);
  const fields = form.querySelector(".fields");
  const err = document.getElementById("signup-err");
  const testversie = location.hostname.endsWith("github.io") || location.protocol === "file:";
  const logoUrl = document.querySelector('link[rel="icon"]').href;

  const TITELS = { recreant: "Recreanten", competitie: "Competitie", jeugd: "Jeugd" };
  const waarde = naam => {
    const el = form.elements[naam];
    if (!el) return "";
    if (el instanceof RadioNodeList) {
      const aan = [...el].find(i => i.checked && !i.disabled);
      return aan ? aan.value : "";
    }
    return el.disabled ? "" : el.value.trim();
  };
  const soort = () => waarde("soort");

  // ---------- Velden tonen en verbergen ----------
  function bijwerken() {
    const s = soort();
    const betaling = waarde("betaling");
    fields.hidden = !s;
    form.querySelectorAll("[data-voor]").forEach(el => {
      el.hidden = !el.dataset.voor.split(" ").includes(s);
    });
    form.querySelectorAll("[data-iban]").forEach(el => {
      el.hidden = s === "jeugd" && betaling !== "iban";
    });
    form.querySelectorAll("[data-stadspas]").forEach(el => {
      el.hidden = !(s === "jeugd" && betaling === "stadspas");
    });
    // Verborgen velden uitschakelen: dan zijn ze niet verplicht en worden ze niet verstuurd.
    fields.querySelectorAll("input, select, textarea").forEach(el => {
      if (el.name === "website") return;
      el.disabled = !!el.parentElement.closest("[hidden]:not(.fields)");
    });
  }
  form.addEventListener("change", e => {
    if (e.target.name === "soort" || e.target.name === "betaling") bijwerken();
  });

  const vandaag = new Date();
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  form.elements.datum.value = iso(vandaag);
  bijwerken();

  // ---------- Handtekening ----------
  const pad = document.getElementById("sign-pad");
  const ctx = pad.getContext("2d");
  let getekend = false, tekenen = false;
  ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#14231f";
  const punt = e => {
    const r = pad.getBoundingClientRect();
    return [(e.clientX - r.left) * pad.width / r.width, (e.clientY - r.top) * pad.height / r.height];
  };
  pad.addEventListener("pointerdown", e => {
    tekenen = true; pad.setPointerCapture(e.pointerId);
    if (!err.hidden) fout("");
    ctx.beginPath(); ctx.moveTo(...punt(e));
  });
  pad.addEventListener("pointermove", e => {
    if (!tekenen) return;
    ctx.lineTo(...punt(e)); ctx.stroke(); getekend = true;
  });
  ["pointerup", "pointercancel"].forEach(t => pad.addEventListener(t, () => { tekenen = false; }));
  document.getElementById("sign-clear").addEventListener("click", () => {
    ctx.clearRect(0, 0, pad.width, pad.height); getekend = false;
  });

  // ---------- Controle ----------
  function ibanKlopt(iban) {
    const s = iban.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
    const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55);
    let rest = 0;
    for (const c of r) rest = (rest * 10 + +c) % 97;
    return rest === 1;
  }
  function fout(melding) {
    err.textContent = melding;
    err.hidden = !melding;
    if (melding) err.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function controleer() {
    fout("");
    if (!soort()) { fout(tekst("Kies eerst waarvoor je je inschrijft.", "First choose what you are signing up for.")); return false; }
    if (!form.checkValidity()) { form.reportValidity(); return false; }
    const iban = form.elements.iban;
    if (!iban.disabled && !ibanKlopt(iban.value)) {
      fout(tekst("Het IBAN-nummer klopt niet. Controleer het nog even.", "The IBAN is not valid. Please check it."));
      iban.focus(); return false;
    }
    if (!getekend) { fout(tekst("Zet je handtekening in het vak.", "Please sign in the signature box.")); return false; }
    return true;
  }

  // ---------- PDF ----------
  let logoData = null;
  async function logo() {
    if (logoData) return logoData;
    try {
      const blob = await (await fetch(logoUrl)).blob();
      logoData = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(blob); });
    } catch (e) { logoData = ""; }
    return logoData;
  }
  const datumNL = v => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split("-").reverse().join("-") : v);

  // leeg = true geeft een leeg formulier om te printen en met de hand in te vullen.
  async function maakPdf(s, leeg) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const v = naam => (leeg ? "" : waarde(naam));
    const L = 20, X = 75, R = 190;
    let y = 22;

    const img = await logo();
    if (img) doc.addImage(img, "PNG", R - 24, 12, 24, 24);
    doc.setFont("helvetica", "bold"); doc.setFontSize(19); doc.setTextColor(19, 97, 83);
    doc.text(`Inschrijfformulier ${TITELS[s]}`, L, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80);
    doc.text("BV Gaasperdam · Sporthal Gaasperdam, Ravenswaaipad 5, Amsterdam Zuidoost", L, y + 7);
    if (leeg) doc.text("Invullen in blokletters a.u.b.", L, y + 12);
    doc.setTextColor(20); y = 46;

    const label = t => { doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.text(t, L, y); doc.setFont("helvetica", "normal"); };
    const lijn = (x1 = X, x2 = R) => { doc.setDrawColor(150); doc.setLineWidth(0.2); doc.line(x1, y + 1.2, x2, y + 1.2); };
    const regel = (t, w, stap = 9) => {
      label(t);
      if (w) doc.text(doc.splitTextToSize(w, R - X), X, y); else lijn();
      y += w ? Math.max(stap, doc.splitTextToSize(w, R - X).length * 5 + 4) : stap;
    };
    const vakje = (x, aan) => {
      doc.setDrawColor(60); doc.setLineWidth(0.3); doc.rect(x, y - 3.4, 3.8, 3.8);
      if (aan) { doc.setFont("helvetica", "bold"); doc.text("X", x + 0.8, y - 0.2); doc.setFont("helvetica", "normal"); }
    };
    const keuze = (t, opties, gekozen) => {
      label(t);
      let x = X;
      opties.forEach(([waarde, tekst]) => { vakje(x, gekozen === waarde); doc.text(tekst, x + 6, y); x += doc.getTextWidth(tekst) + 16; });
      y += 9;
    };
    const hokjes = (x, n, voor = []) => {
      doc.setDrawColor(60); doc.setLineWidth(0.25);
      for (let i = 0; i < n; i++) {
        doc.rect(x + i * 5.6, y - 4, 5.6, 6);
        if (voor[i]) doc.text(voor[i], x + i * 5.6 + 1.6, y + 0.4);
      }
    };
    const iban = () => {
      const w = v("iban");
      label("IBAN");
      if (w) doc.text(w.replace(/\s+/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim(), X, y);
      else hokjes(X, 18, ["N", "L"]);
      y += 10;
    };

    const geslacht = v("geslacht");
    regel("Voornaam", v("voornaam"));
    regel("Achternaam", v("achternaam"));
    if (s === "jeugd") {
      regel("Geboortedatum", datumNL(v("geboortedatum")));
      keuze("Geslacht", [["jongen", "jongen"], ["meisje", "meisje"]], geslacht);
      regel("Straat en huisnummer", v("adres"));
    } else {
      keuze("Geslacht", [["man", "man"], ["vrouw", "vrouw"]], geslacht);
      regel("Adres", v("adres"));
    }
    regel("Postcode", v("postcode"));
    regel("Woonplaats", v("woonplaats"));
    if (s !== "jeugd") regel("Geboortedatum", datumNL(v("geboortedatum")));
    regel("Telefoon", v("telefoon"));
    regel("E-mail", v("email"));

    if (s === "jeugd") {
      regel("Telefoon ouder", v("telefoon_ouder"));
      const b = v("betaling");
      label("Contributie");
      vakje(X, b === "iban"); doc.text("betaal ik zelf, met IBAN:", X + 6, y); y += 8;
      if (!leeg && b === "iban") { doc.text(v("iban").replace(/\s+/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim(), X + 6, y); }
      else if (leeg) hokjes(X + 6, 18, ["N", "L"]);
      if (leeg || b === "iban") y += 9;
      vakje(X, b === "stadspas"); doc.text("via de Stadspas*, nummer:", X + 6, y); y += 8;
      if (!leeg && b === "stadspas") doc.text("6064 3660 110 " + v("stadspas"), X + 6, y);
      else if (leeg) { doc.text("6064 3660 110", X + 6, y); hokjes(X + 33, 8); }
      if (leeg || b === "stadspas") y += 9;
      regel("Datum lidmaatschap", datumNL(v("datum")));
    } else {
      if (s === "recreant") {
        const gekozen = leeg ? [] : [...form.querySelectorAll('[name="speelavond[]"]:checked')].map(i => i.value);
        label("Voorkeur speelavond");
        ["Dinsdag 19.30 - 21.30", "Woensdag 19.00 - 21.00", "Woensdag 21.00 - 23.00"].forEach(o => {
          vakje(X, gekozen.includes(o)); doc.text(o, X + 6, y); y += 6.5;
        });
        y += 3;
      } else {
        regel("Welk team", v("team"));
        regel("Speelavond", v("speelavond_comp"));
      }
      regel("Datum van inschrijving", datumNL(v("datum")));
      iban();
    }
    if (v("opmerking")) regel("Opmerking", v("opmerking"));

    // Verklaring, datum en handtekening
    y += 3;
    doc.setFontSize(9.5);
    const verklaring = (s === "jeugd" ? "Ik verklaar als ouder of verzorger" : "Ik verklaar") +
      " akkoord te zijn met de statuten, het huishoudelijk reglement en de privacyverklaring van BV Gaasperdam." +
      " In het bijzonder ben ik op de hoogte van de regels omtrent opzeggen: minimaal een maand voor de halfjaarlijkse" +
      " contributie-inning, die altijd plaatsvindt in april en oktober, door een e-mail te sturen naar ledenadministratie@bvgaasperdam.nl.";
    const regels = doc.splitTextToSize(verklaring, R - L - (leeg ? 0 : 7));
    if (!leeg) vakje(L, waarde("akkoord") === "ja");
    doc.text(regels, leeg ? L : L + 7, y);
    y += regels.length * 4.5 + 6;
    doc.setFontSize(10.5);

    if (s === "jeugd") regel("Naam ouder/verzorger", v("naam_ouder"));
    regel("Datum", leeg ? "" : datumNL(iso(new Date())));
    label(s === "jeugd" ? "Handtekening ouder/verzorger" : "Handtekening lid");
    if (!leeg && getekend) doc.addImage(pad.toDataURL("image/png"), "PNG", X, y - 9, 56, 16);
    else { y += 12; lijn(X, X + 70); }
    y += 14;

    doc.setFontSize(8.5); doc.setTextColor(90);
    if (s === "jeugd") {
      const voet = "* Heeft een ouder een Stadspas? Dan kunnen wij de contributie via de Stadspas innen. Voorwaarde is dat de Stadspas niet" +
        " gebruikt wordt om de contributie van een andere vereniging te betalen. Ook kun je via de Stadspas soms materiaal (racket, schoenen," +
        " sportkleding) aanschaffen. Meer informatie: jeugd@bvgaasperdam.nl.";
      doc.text(doc.splitTextToSize(voet, R - L), L, Math.max(y, 262));
    }
    doc.text(leeg
      ? "Inleveren bij de zaalbegeleider of ingescand mailen naar ledenadministratie@bvgaasperdam.nl."
      : `Online ingevuld via de website van BV Gaasperdam op ${datumNL(iso(new Date()))}.`, L, 285);
    return doc;
  }

  const bestandsnaam = () =>
    `Inschrijving BV Gaasperdam - ${waarde("voornaam")} ${waarde("achternaam")}`.trim().replace(/[\\/:*?"<>|]/g, "") + ".pdf";

  async function download() {
    if (!soort()) { fout(tekst("Kies eerst waarvoor je je inschrijft.", "First choose what you are signing up for.")); return; }
    (await maakPdf(soort(), false)).save(bestandsnaam());
  }
  document.getElementById("pdf-btn").addEventListener("click", download);
  document.getElementById("pdf-done").addEventListener("click", download);

  document.getElementById("blank-btn").addEventListener("click", async () => {
    if (!soort()) {
      fout(tekst("Kies eerst hierboven waarvoor je je inschrijft, dan maken we het juiste lege formulier.",
                 "First choose above what you are signing up for, so you get the right empty form."));
      fields.hidden = true; err.hidden = false;
      form.querySelector(".soort").after(err);
      return;
    }
    fout("");
    (await maakPdf(soort(), true)).save(`Inschrijfformulier ${TITELS[soort()]} BV Gaasperdam.pdf`);
  });

  // ---------- Versturen ----------
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (fields.querySelector("#signup-err") === null) fields.querySelector(".btns").before(err);
    if (!controleer()) return;
    const knop = form.querySelector('button[type="submit"]');
    knop.disabled = true;
    try {
      const doc = await maakPdf(soort(), false);
      form.elements.pdf.value = doc.output("datauristring").split(",")[1];
      if (testversie) {
        document.getElementById("signup-demo").hidden = false;
        return;
      }
      const antwoord = await fetch(form.action, {
        method: "POST", body: new FormData(form), headers: { "X-Requested-With": "fetch" }
      });
      const json = await antwoord.json().catch(() => ({}));
      if (!antwoord.ok || !json.ok) throw new Error(json.fout || antwoord.status);
      fields.hidden = true;
      form.querySelector(".soort").hidden = true;
      document.getElementById("blank-btn").parentElement.hidden = true;
      document.getElementById("signup-done").hidden = false;
      document.getElementById("signup-done").scrollIntoView({ block: "center", behavior: "smooth" });
    } catch (ex) {
      fout(tekst("Het versturen is niet gelukt. Download het formulier als PDF en mail het naar ledenadministratie@bvgaasperdam.nl.",
                 "Sending failed. Please download the form as a PDF and email it to ledenadministratie@bvgaasperdam.nl."));
    } finally {
      knop.disabled = false;
    }
  });
})();
