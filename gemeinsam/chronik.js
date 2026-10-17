// Chronik für alle Varianten. Jeder Eintrag nennt seine Quelle – nur Belegtes, Daten nur so genau wie belegt.
// Ausgabe in <ol data-hof="chronik">: <li class="eintrag"> mit .eintrag-text (.wann, h3, p) und .bogen (Bild) oder .ohne-bild.
(function () {
  const BILD = (document.currentScript && document.currentScript.dataset.bilder) || "../bilder/";
  const EINTRÄGE = [
    { wann: "Seit Generationen", titel: "Ein Familienbetrieb in Deckenpfronn",
      text: "Den Hühnerhof bei Herrenberg führt die Familie Schneider in dritter Generation. Im Mittelpunkt stehen unsere Legehennen und ihre Eier.",
      bild: "huhn-stange.jpg", alt: "Eine braune Henne auf einer Stange im Stall" },
      // Quelle: alte Website (Startseite), Instagram-Profil
    { wann: "März 2020", titel: "Das SB-Lädle bleibt offen",
      text: "Auch in der Corona-Zeit ist unser Selbstbedienungs-Lädle wie gewohnt für euch da. S'Lädle isch immer offa.",
      zeichen: "ei" },
      // Quelle: alte Website, Meldung „Corona Maßnahmen“ vom 22.03.2020; Abschnitt „Selbstbedienungsschrank“
    { wann: "2020", titel: "Unsere erste Blühwiese",
      text: "Gemeinsam mit vielen Blühwiesenpaten säen wir an der B296 zwischen Deckenpfronn und Stammheim eine Wiese für heimische Insekten. Bald sind Hummeln und Marienkäfer da. Vom Überschuss pflanzen wir zwei Zwetschgenbäume.",
      zeichen: "blume" },
      // Quelle: alte Website, Seite „Blühwiese“ (Einträge 23.03.–31.12.2020)
    { wann: "2021", titel: "Die zweite Blühwiese",
      text: "Auch 2021 gibt es eine Blühwiese – diesmal an der B296 kurz vor Oberjesingen.",
      zeichen: "blume" },
      // Quelle: alte Website, Seite „Blühwiese“ (01.05.2021)
    { wann: "2023", titel: "Auf den Wochenmärkten",
      text: "Samstags von 7 bis 12 Uhr stehen wir in Gärtringen, mittwochs in Böblingen – dort zusätzlich mit frischem Obst und Gemüse.",
      bild: "markt-gemuese.jpg", alt: "Kisten mit Gemüse am Marktstand in Böblingen" },
      // Quelle: Instagram-Posts August 2023 (Gärtringen, Böblingen)
    { wann: "Herbst 2023", titel: "Eigene Äpfel, junge Hennen",
      text: "Wir ernten die ersten Äpfel und Birnen von unseren Bäumen. Und ein Stall voll junger Hennen zieht bei uns ein.",
      bild: "aepfel.jpg", alt: "Eine Kiste grüner Äpfel unter Obstbäumen" },
      // Quelle: Instagram-Posts „erste Ladung Äpfel und Birnen“ und „Stall voll neuer Mitarbeiterinnen“
    { wann: "Frühjahr 2024", titel: "Ein Bus wird zum Hofladen",
      text: "Regionales Einkaufen auf dem Land wird schwieriger. Wir kündigen ein neues Projekt an und bauen einen Bus zum mobilen Hofladen um.",
      bild: "bus-umbau.jpg", alt: "Der leergeräumte Bus während des Umbaus" },
      // Quelle: alte Website, Meldung „Mobiler Hofladen“ vom 03.04.2024; Instagram-Post mit Umbaubildern
    { wann: "20. Juli 2024", titel: "Der Hofbus öffnet",
      text: "Zum ersten Mal öffnet unser mobiler Hofladen. Montags, donnerstags und samstags ersetzt er unseren alten Laden direkt bei uns im Hof.",
      zeichen: "bus" },
      // Quelle: Instagram-Post zur Eröffnung des mobilen Hofladens, Story-Grafik „Samstag 20.07.“
    { wann: "August 2024", titel: "Neue Haltestellen",
      text: "Freitags fahren wir nach Gültlingen, dienstags nach Holzbronn. Das Calwer Journal berichtet über unseren mobilen Hofladen.",
      bild: "hofbus-traktor.jpg", alt: "Der Hofbus mit Traktor in Holzbronn" },
      // Quelle: Instagram-Posts Gültlingen, „Hallo Holzbronn“, Dank an das Calwer Journal
    { wann: "November 2024", titel: "Im Fernsehen und mit Karte",
      text: "RTF1 zeigt einen Beitrag über uns von der Schön & Gut Messe in Münsingen. Und ab jetzt könnt ihr bei uns auch mit Karte zahlen.",
      bild: "kartenzahlung.jpg", alt: "Kartenterminal vor gestapelten Eierpaletten" },
      // Quelle: Instagram-Reel (Dank an RTF1), Instagram-Post zur Kartenzahlung
    { wann: "August 2025", titel: "Ein großes Projekt",
      text: "Wir zeigen zum ersten Mal, woran wir seit Monaten arbeiten: Direkt am Hühnerhof entsteht ein neues Gebäude.",
      bild: "baustart.jpg", alt: "Ein Bagger auf der Wiese, davor ein Spaten mit Bauhelm" },
      // Quelle: Instagram-Post „Lange habt ihr nichts von uns gehört“ mit Baustellenbildern
    { wann: "November 2025", titel: "Schindeln aus dem Allgäu",
      text: "Wir besuchen das Schindelzentrum im Allgäu und nehmen die Holzschindeln gleich selbst im Auto mit.",
      zeichen: "schindel" },
      // Quelle: Instagram-Post Juli 2026 („Im November haben wir das Schindelzentrum im Allgäu besucht“)
    { wann: "März 2026", titel: "Ein erster Blick hinein",
      text: "Im Obergeschoss liegt der Estrich. Wir kündigen an: Hofladen und Hofcafé öffnen im Herbst oder Winter.",
      bild: "neubau-innen.jpg", alt: "Heller Innenraum aus Holz mit großen Fenstern" },
      // Quelle: Instagram-Post „Sneak Peek“
    { wann: "Juli 2026", titel: "Holzfassade und Schindelwand",
      text: "Die Fassade bekommt ihr Holzkleid, die Außentreppe ins Obergeschoss steht, und oben ist die erste Wand mit Schindeln fertig.",
      bild: "schindelwand.jpg", alt: "Lange Wand aus hellen Holzschindeln" },
      // Quelle: Instagram-Post Juli 2026 („Die letzten Wochen waren mal wieder ziemlich kontrastreich“)
    { wann: "Kurz vor der Eröffnung", titel: "Das Herzstück zieht ein",
      text: "Die Espressomaschine für das Hofcafé ist da.",
      bild: "espresso.jpg", alt: "Die neue Espressomaschine" },
      // Quelle: Instagram-Highlight „Neuer Hofladen“ („Das Herzstück unseres Cafés ist eingezogen“)
    { wann: "7. November 2026", titel: "Eröffnung", ziel: true,
      text: "Schneiders Hofladen & Hofcafé öffnet in Mahden 1, Deckenpfronn – direkt bei uns am Hühnerhof.",
      bild: "neubau-aussen.jpg", alt: "Der neue Hofladen aus Holz" },
      // Quelle: Instagram-Post und Plakat zur Eröffnung
  ];

  const ZEICHEN = {
    blume: '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="30" r="7"/><circle cx="40" cy="16" r="8"/><circle cx="53" cy="26" r="8"/><circle cx="49" cy="41" r="8"/><circle cx="31" cy="41" r="8"/><circle cx="27" cy="26" r="8"/><path d="M40 47v28M40 64c-8-2-12-8-12-12M40 60c7-1 11-6 12-10"/></svg>',
    ei: '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 8C26 8 16 32 16 46a24 24 0 0 0 48 0C64 32 54 8 40 8z"/></svg>',
    bus: '<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="8" y="22" width="58" height="34" rx="5"/><path d="M14 30h46M66 34h6v16h-6"/><circle cx="22" cy="58" r="6"/><circle cx="52" cy="58" r="6"/><path d="M20 30v14M32 30v14M44 30v14"/></svg>',
    schindel: '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M10 20h60M10 38h60M10 56h60M20 20v18M35 20v18M50 20v18M65 20v18M12 38v18M27 38v18M42 38v18M57 38v18"/><path d="M10 20a5 5 0 0 0 10 0M20 20a5 5 0 0 0 15 0M35 20a5 5 0 0 0 15 0M50 20a5 5 0 0 0 15 0"/></svg>',
  };

  function zeichnen() {
    document.querySelectorAll("[data-hof=chronik]").forEach(el => {
      el.innerHTML = EINTRÄGE.map(e => `<li class="eintrag${e.ziel ? " ziel" : ""}">
        <div class="eintrag-text"><p class="wann">${e.wann}</p><h3>${e.titel}</h3><p>${e.text}</p></div>
        ${e.bild ? `<div class="bogen"><img src="${BILD}${e.bild}" alt="${e.alt}" loading="lazy" width="800" height="600"></div>`
                 : `<div class="ohne-bild">${ZEICHEN[e.zeichen] || ""}</div>`}
      </li>`).join("");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", zeichnen); else zeichnen();
})();
