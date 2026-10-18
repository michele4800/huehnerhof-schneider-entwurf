// Nur in der Entwurfsvorschau: Knopf „Rückmeldung“ unten rechts öffnet das gemeinsame Google-Dokument.
// Beim Klick wird „Entwurf …, Seite …“ in die Zwischenablage gelegt, damit es im Dokument eingefügt werden kann.
// Im Livegang-Paket nicht enthalten.
(function () {
  const DOKUMENT = "https://docs.google.com/document/d/1s0-y8TOCyhgfgGwpHi800Wgi6SjIm-tamG3MyYi9UAQ/edit";
  const ENTWÜRFE = { eroeffnung: "Entwurf 1 – Eröffnung", hofbus: "Entwurf 2 – Kräftig", hofgeschichte: "Entwurf 3 – Erzählend" };
  const SEITEN = { "index.html": "Startseite", "unterwegs.html": "Hofbus & Märkte", "geschichte.html": "Geschichte", "impressum.html": "Impressum", "datenschutz.html": "Datenschutz" };
  const teile = location.pathname.split("/").filter(Boolean);
  const seite = /\.html$/.test(teile[teile.length - 1] || "") ? teile.pop() : "index.html";
  const entwurf = teile.pop();
  if (!ENTWÜRFE[entwurf]) return;
  const stelle = `${ENTWÜRFE[entwurf]}, ${SEITEN[seite] || seite}`;

  const css = document.createElement("style");
  css.textContent = `
    .anm-knopf{position:fixed;right:16px;bottom:16px;z-index:40;font:600 .95rem/1 system-ui,sans-serif;background:#1d1d1b;color:#fff;border-radius:999px;padding:12px 18px;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.25)}
    .anm-knopf:focus-visible{outline:3px solid #f2c14e;outline-offset:3px}
    .anm-hinweis{position:fixed;right:16px;bottom:64px;z-index:40;max-width:280px;background:#fff;color:#1d1d1b;font:400 .9rem/1.4 system-ui,sans-serif;border-radius:10px;padding:10px 14px;box-shadow:0 6px 18px rgba(0,0,0,.2)}
  `;
  document.head.appendChild(css);

  const knopf = document.createElement("a");
  knopf.className = "anm-knopf"; knopf.href = DOKUMENT; knopf.target = "_blank"; knopf.rel = "noopener";
  knopf.innerHTML = `Rückmeldung<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"> zu ${stelle} im gemeinsamen Dokument (neues Fenster)</span>`;
  const hinweis = document.createElement("p");
  hinweis.className = "anm-hinweis"; hinweis.setAttribute("role", "status"); hinweis.hidden = true;
  document.body.append(hinweis, knopf);

  knopf.addEventListener("click", async () => {
    let kopiert = false;
    try { await navigator.clipboard.writeText(stelle); kopiert = true; } catch (e) {}
    hinweis.textContent = kopiert ? `„${stelle}“ ist kopiert – im Dokument bei „Anmerkungen“ einfügen.` : `Bitte im Dokument dazuschreiben: ${stelle}`;
    hinweis.hidden = false;
    clearTimeout(hinweis._t); hinweis._t = setTimeout(() => { hinweis.hidden = true; }, 8000);
  });
})();
