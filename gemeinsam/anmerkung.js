// Nur in der Entwurfsvorschau: Knopf „Anmerkung“ unten rechts. Notizen bleiben im Browser des Kunden (localStorage)
// und werden auf der Übersichtsseite gesammelt, um sie gemeinsam zu verschicken. Im Livegang-Paket nicht enthalten.
(function () {
  const SCHLÜSSEL = "hof-anmerkungen";
  const ENTWÜRFE = { eroeffnung: "Entwurf 1 – Eröffnung", hofbus: "Entwurf 2 – Kräftig", hofgeschichte: "Entwurf 3 – Erzählend" };
  const SEITEN = { "index.html": "Startseite", "unterwegs.html": "Hofbus & Märkte", "geschichte.html": "Geschichte", "impressum.html": "Impressum", "datenschutz.html": "Datenschutz" };
  const teile = location.pathname.split("/").filter(Boolean);
  const seite = /\.html$/.test(teile[teile.length - 1] || "") ? teile.pop() : "index.html";
  const entwurf = teile.pop();
  if (!ENTWÜRFE[entwurf]) return;
  const id = entwurf + "/" + seite;

  const lesen = () => { try { return JSON.parse(localStorage.getItem(SCHLÜSSEL)) || {}; } catch (e) { return {}; } };
  const schreiben = alle => { try { localStorage.setItem(SCHLÜSSEL, JSON.stringify(alle)); return true; } catch (e) { return false; } };

  const css = document.createElement("style");
  css.textContent = `
    .anm-knopf{position:fixed;right:16px;bottom:16px;z-index:40;font:600 .95rem/1 system-ui,sans-serif;background:#1d1d1b;color:#fff;border:0;border-radius:999px;padding:12px 18px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25)}
    .anm-knopf:focus-visible{outline:3px solid #f2c14e;outline-offset:3px}
    .anm-knopf .anm-zahl{display:inline-block;min-width:1.4em;margin-left:6px;padding:2px 6px;border-radius:999px;background:#f2c14e;color:#1d1d1b;font-size:.8rem}
    .anm-dialog{border:0;border-radius:14px;padding:0;width:min(520px,calc(100vw - 32px));font:400 1rem/1.5 system-ui,sans-serif;color:#1d1d1b}
    .anm-dialog::backdrop{background:rgba(0,0,0,.45)}
    .anm-dialog form{padding:22px}
    .anm-dialog h2{font:700 1.15rem/1.3 system-ui,sans-serif;margin:0 0 4px;letter-spacing:normal;text-transform:none;color:#1d1d1b}
    .anm-dialog p{margin:0 0 14px;color:#555;font-size:.92rem}
    .anm-dialog label{display:block;font-weight:600;margin-bottom:6px}
    .anm-dialog textarea{width:100%;min-height:150px;font:inherit;padding:10px;border:1px solid #999;border-radius:8px;resize:vertical;box-sizing:border-box}
    .anm-dialog textarea:focus-visible{outline:3px solid #2f6f8a;outline-offset:1px}
    .anm-zeile{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}
    .anm-zeile button{font:600 .95rem system-ui,sans-serif;border-radius:999px;padding:10px 18px;cursor:pointer;border:2px solid #1d1d1b}
    .anm-zeile .anm-speichern{background:#1d1d1b;color:#fff}
    .anm-zeile .anm-abbrechen{background:#fff;color:#1d1d1b}
    .anm-zeile button:focus-visible{outline:3px solid #2f6f8a;outline-offset:2px}
    .anm-status{font-size:.9rem;color:#2d6a1f;margin-top:10px;min-height:1.2em}
    @media (max-width:520px){.anm-knopf{padding:11px 14px}}
  `;
  document.head.appendChild(css);

  const knopf = document.createElement("button");
  knopf.type = "button"; knopf.className = "anm-knopf";
  const dialog = document.createElement("dialog");
  dialog.className = "anm-dialog"; dialog.setAttribute("aria-labelledby", "anm-titel");
  dialog.innerHTML = `<form method="dialog">
      <h2 id="anm-titel">Anmerkung zu dieser Seite</h2>
      <p>${ENTWÜRFE[entwurf]}, ${SEITEN[seite] || seite}. Die Notiz bleibt in deinem Browser und erscheint auf der Übersichtsseite im Formular.</p>
      <label for="anm-text">Was soll anders sein?</label>
      <textarea id="anm-text" placeholder="z. B. „Das Foto oben bitte austauschen“ oder „Text zum Hofbus kürzer“"></textarea>
      <p class="anm-status" role="status"></p>
      <div class="anm-zeile">
        <button type="button" class="anm-abbrechen">Schließen</button>
        <button type="button" class="anm-speichern">Anmerkung speichern</button>
      </div>
    </form>`;
  document.body.append(knopf, dialog);
  const feld = dialog.querySelector("textarea"), status = dialog.querySelector(".anm-status");

  function beschriften() {
    const alle = lesen(), anzahl = Object.values(alle).filter(a => a.text).length;
    knopf.innerHTML = (alle[id] && alle[id].text ? "Anmerkung bearbeiten" : "Anmerkung") + (anzahl ? `<span class="anm-zahl" aria-label="${anzahl} gespeichert">${anzahl}</span>` : "");
  }
  knopf.addEventListener("click", () => {
    feld.value = (lesen()[id] || {}).text || ""; status.textContent = "";
    dialog.showModal(); feld.focus();
  });
  dialog.querySelector(".anm-abbrechen").addEventListener("click", () => dialog.close());
  dialog.querySelector(".anm-speichern").addEventListener("click", () => {
    const alle = lesen(), text = feld.value.trim();
    if (text) alle[id] = { entwurf: ENTWÜRFE[entwurf], seite: SEITEN[seite] || seite, text, zeit: new Date().toISOString() };
    else delete alle[id];
    status.textContent = schreiben(alle) ? (text ? "Gespeichert. Du findest sie auf der Übersichtsseite." : "Anmerkung gelöscht.") : "Speichern ist in diesem Browser nicht möglich – bitte den Text kopieren.";
    beschriften();
  });
  dialog.addEventListener("close", () => knopf.focus());
  beschriften();
})();
