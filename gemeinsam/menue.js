// Mobiles Menü: öffnen/schließen, nach Klick auf einen Link oder mit Escape wieder zu
(function () {
  const knopf = document.querySelector(".menue"), nav = document.getElementById("nav");
  if (!knopf || !nav) return;
  const zu = () => { nav.classList.remove("auf"); knopf.setAttribute("aria-expanded", false); };
  knopf.addEventListener("click", () => { const auf = nav.classList.toggle("auf"); knopf.setAttribute("aria-expanded", auf); });
  nav.addEventListener("click", e => { if (e.target.closest("a")) zu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("auf")) { zu(); knopf.focus(); } });
})();
