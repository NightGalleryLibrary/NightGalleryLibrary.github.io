(function (global) {
  "use strict";
  function Nave(opts) {
    this.onOpenChapel = opts.onOpenChapel || function () {};
  }
  Nave.prototype.start = function () {
    var self = this;
    document.querySelectorAll(".pair").forEach(function (el) {
      function open() { self.onOpenChapel(el.getAttribute("data-plate")); }
      el.addEventListener("click", open);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
    document.querySelectorAll(".clerestory .light").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var id = a.getAttribute("data-plate");
        var target = document.getElementById("plate-" + id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };
  Nave.prototype.stopScroll = function () {};
  Nave.prototype.startScroll = function () {};
  global.NGLNave = Nave;
})(window);
