// Mobiles Menü: öffnen/schließen, nach Klick auf einen Link wieder zu
(function () {
  const knopf = document.querySelector(".menue"), nav = document.getElementById("nav");
  if (!knopf || !nav) return;
  knopf.addEventListener("click", () => { const auf = nav.classList.toggle("auf"); knopf.setAttribute("aria-expanded", auf); });
  nav.addEventListener("click", e => { if (e.target.tagName === "A") { nav.classList.remove("auf"); knopf.setAttribute("aria-expanded", false); } });
})();
