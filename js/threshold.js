(function (global) {
  "use strict";

  var EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
  var played = false;

  function play(opts) {
    opts = opts || {};
    if (played) return;
    played = true;
    var reduced = !!opts.reduced;
    var el = document.getElementById("threshold");
    var roseImg = document.querySelector(".rose-aperture img");

    function revealRose() {
      if (roseImg) {
        if (roseImg.complete) roseImg.classList.add("is-in");
        else roseImg.addEventListener("load", function () { roseImg.classList.add("is-in"); });
      }
    }

    if (reduced || !el) {
      if (el) {
        el.classList.add("is-done");
        el.setAttribute("hidden", "");
      }
      revealRose();
      if (opts.onDone) opts.onDone();
      return;
    }

    el.classList.add("is-scribing");

    var gsap = global.gsap;
    if (!gsap) {
      setTimeout(function () { el.classList.add("is-speaking"); }, 700);
      setTimeout(function () {
        el.classList.add("is-done");
        revealRose();
        if (opts.onDone) opts.onDone();
        setTimeout(function () { el.setAttribute("hidden", ""); }, 600);
      }, 2200);
      return;
    }

    var tl = gsap.timeline({
      onComplete: function () {
        el.classList.add("is-done");
        revealRose();
        if (opts.onDone) opts.onDone();
        gsap.delayedCall(0.55, function () { el.setAttribute("hidden", ""); });
      }
    });
    tl.to({}, { duration: 0.7 });
    tl.add(function () { el.classList.add("is-speaking"); });
    tl.to({}, { duration: 1.35 });
  }

  global.NGLThreshold = { play: play, EASE: EASE };
})(window);
