/* La Fleur d'Or : dessine les QR codes de l'affiche (bibliothèque qrcode-generator, MIT). */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function dessiner(el) {
    var qr = qrcode(0, "M");
    qr.addData(el.getAttribute("data-qr"));
    qr.make();
    var n = qr.getModuleCount();
    var marge = 4; // zone blanche réglementaire autour du code
    var d = "";
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        if (qr.isDark(y, x)) d += "M" + (x + marge) + " " + (y + marge) + "h1v1h-1z";
      }
    }
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + (n + 2 * marge) + " " + (n + 2 * marge));
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("aria-hidden", "true");
    var fond = document.createElementNS(NS, "rect");
    fond.setAttribute("width", "100%");
    fond.setAttribute("height", "100%");
    fond.setAttribute("fill", "#fff");
    var chemin = document.createElementNS(NS, "path");
    chemin.setAttribute("d", d);
    chemin.setAttribute("fill", "#22262a");
    svg.appendChild(fond);
    svg.appendChild(chemin);
    el.appendChild(svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-qr]"), dessiner);
  document.documentElement.setAttribute("data-pret", "1");

  var bouton = document.querySelector("[data-imprimer]");
  if (bouton) bouton.addEventListener("click", function () { window.print(); });
})();
