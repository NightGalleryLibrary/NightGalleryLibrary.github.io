(function () {
  "use strict";
  var reduced = false;
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) reduced = true;
  } catch (e) {}

  var chapel = new NGLChapel({
    reduced: reduced,
    onClose: function () {},
    onChange: function () {}
  });
  var nave = new NGLNave({
    onOpenChapel: function (id) { chapel.show(id); }
  });

  function boot() { nave.start(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
