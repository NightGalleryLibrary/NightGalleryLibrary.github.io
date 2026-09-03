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
    var path = document.getElementById("meanderPath");
    var roseImg = document.querySelector(".rose-aperture img");

    function revealRose() {
      if (roseImg) {
        if (roseImg.complete) roseImg.classList.add("is-in");
        else roseImg.addEventListener("load", function () { roseImg.classList.add("is-in"); });
      }
    }

    if (reduced) {
      if (el) {
        el.classList.add("is-done");
        el.setAttribute("hidden", "");
      }
      revealRose();
      if (opts.onDone) opts.onDone();
      return;
    }

    if (!el) {
      revealRose();
      if (opts.onDone) opts.onDone();
      return;
    }

    var len = 0;
    try { len = path.getTotalLength(); } catch (e) { len = 1200; }
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);

    el.classList.add("is-scribing");

    var gsap = global.gsap;
    if (!gsap) {
      /* CSS fallback */
      path.style.transition = "stroke-dashoffset 1.5s linear 0.7s";
      requestAnimationFrame(function () { path.style.strokeDashoffset = "0"; });
      setTimeout(function () { el.classList.add("is-speaking"); }, 2100);
      setTimeout(function () {
        el.classList.add("is-done");
        revealRose();
        if (opts.onDone) opts.onDone();
        setTimeout(function () { el.setAttribute("hidden", ""); }, 800);
      }, 3400);
      return;
    }

    var tl = gsap.timeline({
      onComplete: function () {
        el.classList.add("is-done");
        revealRose();
        if (opts.onDone) opts.onDone();
        gsap.delayedCall(0.8, function () { el.setAttribute("hidden", ""); });
      }
    });

    tl.to(path, {
      strokeDashoffset: 0,
      duration: 1.45,
      delay: 0.55,
      ease: "none"
    }, 0);

    tl.add(function () { el.classList.add("is-speaking"); }, 2.05);
    tl.to({}, { duration: 1.15 });
  }

  global.NGLThreshold = { play: play, EASE: EASE };
})(window);
