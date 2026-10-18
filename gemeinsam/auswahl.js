// Übersichtsseite: Auswahl- und Wunschformular. Speichert nur im Browser (localStorage) und erzeugt einen Text,
// den der Kunde per WhatsApp, E-Mail oder Zwischenablage selbst verschickt. Kein Server, keine Datenübertragung.
(function () {
  const FORM_SCHLÜSSEL = "hof-auswahl", NOTIZ_SCHLÜSSEL = "hof-anmerkungen";
  const form = document.getElementById("wuensche");
  const meldung = document.getElementById("meldung"), vorschau = document.getElementById("vorschau"), liste = document.getElementById("notizen");

  const lesen = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
  const schreiben = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Formular <-> Speicher
  function sichern() {
    const daten = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === "radio") { if (el.checked) daten[el.name] = el.value; }
      else if (el.type === "checkbox") daten[el.name] = el.checked;
      else daten[el.name] = el.value;
    }
    schreiben(FORM_SCHLÜSSEL, daten);
    vorschau.textContent = text() || "(noch nichts ausgefüllt)";
  }
  function laden() {
    const daten = lesen(FORM_SCHLÜSSEL);
    for (const el of form.elements) {
      if (!el.name || !(el.name in daten)) continue;
      if (el.type === "radio") el.checked = daten[el.name] === el.value;
      else if (el.type === "checkbox") el.checked = !!daten[el.name];
      else el.value = daten[el.name];
    }
  }

  // Anmerkungen von den Entwurfsseiten
  function notizenZeigen() {
    const alle = Object.entries(lesen(NOTIZ_SCHLÜSSEL)).filter(([, a]) => a && a.text)
      .sort((a, b) => (a[1].entwurf + a[1].seite).localeCompare(b[1].entwurf + b[1].seite));
    liste.innerHTML = alle.length
      ? alle.map(([id, a]) => `<li><b>${esc(a.entwurf)}, ${esc(a.seite)}</b><p>${esc(a.text)}</p><button type="button" data-loeschen="${esc(id)}">Löschen<span class="nur-vorleser"> – Anmerkung zu ${esc(a.entwurf)}, ${esc(a.seite)}</span></button></li>`).join("")
      : '<li class="leer">Noch keine Anmerkungen. Öffnet einen Entwurf und nutzt den Knopf „Anmerkung“ unten rechts.</li>';
    vorschau.textContent = text() || "(noch nichts ausgefüllt)";
  }
  liste.addEventListener("click", e => {
    const id = e.target.closest("[data-loeschen]")?.dataset.loeschen;
    if (!id) return;
    const alle = lesen(NOTIZ_SCHLÜSSEL); delete alle[id]; schreiben(NOTIZ_SCHLÜSSEL, alle);
    notizenZeigen(); meldung.textContent = "Anmerkung gelöscht.";
  });

  // Text für den Versand
  function text() {
    const d = lesen(FORM_SCHLÜSSEL), zeilen = [];
    const teil = (titel, eintraege) => { const e = eintraege.filter(([, w]) => w && String(w).trim()); if (e.length) zeilen.push("", titel, ...e.map(([k, w]) => `- ${k}: ${String(w).trim()}`)); };
    teil("STIL", [["Auswahl", d.stil], ["Dazu", d.stil_notiz]]);
    teil("FRAGEN", [
      ["Hofbus nach der Eröffnung", [d.hofbus, d.hofbus_notiz].filter(Boolean).join(" – ")],
      ["Wochenmarkt Böblingen", d.boeblingen], ["Kartenzahlung im Hofladen", d.karte],
      ["Sortiment", d.sortiment], ["Hofcafé", d.cafe],
      ["Instagram-Fotos verwenden", d.fotos], ["Neue Fotos kommen", d.neue_fotos ? "ja" : ""],
      ["Impressum", d.impressum], ["USt-IdNr. GmbH", d.ustid],
    ]);
    teil("ÄNDERUNGSWÜNSCHE", [["Startseite", d.wunsch_start], ["Hofbus & Märkte", d.wunsch_mobil], ["Geschichte", d.wunsch_geschichte], ["Allgemein", d.wunsch_allgemein]]);
    teil("ANMERKUNGEN AUF DEN SEITEN", Object.values(lesen(NOTIZ_SCHLÜSSEL)).filter(a => a && a.text).map(a => [`${a.entwurf}, ${a.seite}`, a.text]));
    if (!zeilen.length) return "";
    const von = [d.name, d.rueckruf].filter(Boolean).join(", ");
    return ["Rückmeldung zur neuen Website – Hühnerhof Schneider", ...zeilen, "", von ? "Von: " + von : ""].join("\n").trim();
  }

  async function kopieren(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.append(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e2) {} ta.remove(); return ok;
    }
  }

  form.addEventListener("input", sichern);
  form.addEventListener("change", sichern);
  form.addEventListener("submit", e => e.preventDefault());
  form.querySelector(".senden").addEventListener("click", async e => {
    const art = e.target.closest("[data-senden]")?.dataset.senden;
    if (!art) return;
    sichern();
    if (art === "leeren") {
      if (!confirm("Alle Eingaben im Formular löschen? (Die Anmerkungen auf den Seiten bleiben erhalten.)")) return;
      form.reset(); try { localStorage.removeItem(FORM_SCHLÜSSEL); } catch (e2) {}
      sichern(); meldung.textContent = "Formular geleert."; return;
    }
    const t = text();
    if (!t) { meldung.textContent = "Bitte zuerst etwas auswählen oder eintragen."; return; }
    if (art === "kopieren") { meldung.textContent = (await kopieren(t)) ? "Text kopiert – jetzt einfach in eine Nachricht einfügen." : "Kopieren ging nicht – bitte den Text in der Vorschau markieren und kopieren."; return; }
    if (art === "whatsapp") { window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank", "noopener"); meldung.textContent = "WhatsApp wurde geöffnet – Kontakt auswählen und senden."; return; }
    if (art === "mail") {
      // Lange Texte kürzen manche Mail-Programme – dann zusätzlich in die Zwischenablage
      const lang = t.length > 1800, kopiert = lang && await kopieren(t);
      location.href = "mailto:?subject=" + encodeURIComponent("Rückmeldung zur neuen Website") + "&body=" + encodeURIComponent(t);
      meldung.textContent = lang && kopiert ? "E-Mail wird geöffnet. Der Text ist zusätzlich kopiert, falls er abgeschnitten ist." : "E-Mail wird geöffnet – Empfänger eintragen und senden.";
    }
  });

  laden();
  notizenZeigen();
  sichern();
  // Anmerkungen aus einem anderen Tab übernehmen
  window.addEventListener("storage", e => { if (e.key === NOTIZ_SCHLÜSSEL) notizenZeigen(); });
  window.addEventListener("pageshow", notizenZeigen);
})();
