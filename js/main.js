(function () {
  "use strict";

  var reduced = document.documentElement.classList.contains("no-motion");

  var sun = new NGLSun();
  var canvas = document.getElementById("caustics");
  var floor = document.getElementById("floor");
  var fallback = document.querySelector(".floor-fallback");
  var speck = document.getElementById("sunSpeck");
  var tiltAsk = document.getElementById("tiltAsk");
  var caustics = new NGLCaustics(canvas);
  var glass = new NGLGlass();
  var webglOk = false;
  var glassOk = false;

  function placeSpeck() {
    if (!speck) return;
    var s = sun.get();
    var frame = document.getElementById("roseFrame");
    if (!frame) return;
    speck.hidden = false;
    speck.style.left = ((s.x + 1) / 2 * 100) + "%";
    speck.style.top = ((s.y + 1) / 2 * 100) + "%";
  }

  function bootCursor() {
    var el = document.getElementById("goldCursor");
    if (!el) return;
    var fine = false;
    try {
      fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    } catch (e) {}
    if (!fine) return;

    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var tx = x, ty = y;
    var shown = false;

    function show() {
      if (!shown) {
        shown = true;
        el.hidden = false;
        el.classList.add("is-on");
        document.body.classList.add("gold-cursor");
      }
    }
    function hide() {
      shown = false;
      el.classList.remove("is-on");
      document.body.classList.remove("gold-cursor");
    }

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") {
        hide();
        return;
      }
      tx = e.clientX;
      ty = e.clientY;
      show();
    }, { passive: true });
    window.addEventListener("pointerleave", hide, { passive: true });
    window.addEventListener("blur", hide);
    document.documentElement.addEventListener("mouseleave", hide);

    (function tick() {
      x += (tx - x) * 0.42;
      y += (ty - y) * 0.42;
      el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      requestAnimationFrame(tick);
    })();
  }

  function loop() {
    var s = sun.tick();
    if (webglOk) caustics.setSun(s.x, s.y);
    if (glassOk) glass.setSun(s.x, s.y);
    if (fallback) {
      fallback.style.setProperty("--sx", ((s.x + 1) / 2 * 100) + "%");
      fallback.style.setProperty("--sy", (40 + s.y * 12) + "%");
    }
    placeSpeck();
    requestAnimationFrame(loop);
  }

  function bootLight() {
    if (floor) sun.bindFloor(floor);
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse") sun.fromPointer(e.clientX, e.clientY);
    }, { passive: true });

    glassOk = glass.init({ reduced: reduced });
    if (glassOk) {
      glass.start();
      document.documentElement.classList.add("has-glass");
    } else {
      document.documentElement.classList.add("no-glass");
    }

    if (!reduced) {
      webglOk = caustics.init();
      if (webglOk) {
        caustics.setIntensity(0);
        caustics.start();
        if (window.gsap) {
          window.gsap.to(caustics, { intensity: 0.95, duration: 1.4, ease: "power2.out" });
        } else {
          caustics.setIntensity(0.95);
        }
        canvas.classList.add("is-live");
      } else {
        document.documentElement.classList.add("no-webgl");
        if (fallback) fallback.classList.add("is-live");
      }
    } else {
      document.documentElement.classList.add("no-webgl");
      if (fallback) fallback.classList.add("is-live");
    }

    if (fallback && !webglOk) fallback.classList.add("is-live");

    requestAnimationFrame(loop);
    bootCursor();

    var gestured = false;
    function onGesture() {
      if (gestured || reduced) return;
      gestured = true;
      sun.armTilt();
      if (tiltAsk && window.DeviceOrientationEvent) {
        tiltAsk.hidden = false;
        tiltAsk.classList.add("is-shown");
      }
    }
    window.addEventListener("pointerdown", onGesture, { once: true, passive: true });
    if (tiltAsk) {
      tiltAsk.addEventListener("click", function () {
        sun.enableTilt().then(function () {
          tiltAsk.classList.remove("is-shown");
          tiltAsk.hidden = true;
        });
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (webglOk) caustics.paused = true;
        if (glassOk) glass.paused = true;
      } else {
        if (webglOk) caustics.paused = false;
        if (glassOk) glass.paused = false;
      }
    });
  }

  var chapel = new NGLChapel({
    reduced: reduced,
    onClose: function () {
      nave.startScroll();
      document.querySelectorAll(".lancet").forEach(function (el) {
        el.classList.remove("is-ember");
      });
      if (webglOk) {
        canvas.classList.remove("is-dim");
        caustics.setIntensity(0.95);
      }
    },
    onChange: function () {}
  });

  var nave = new NGLNave({
    reduced: reduced,
    onScroll: function (p) { sun.setScroll(p); },
    onGhost: function (id) {
      if (glassOk) glass.floodTo(id, 0.14, 0.18);
    },
    onGhostCancel: function (id) {
      if (glassOk) glass.floodTo(id, 0, 0.22);
    },
    onFlood: function (id) {
      if (glassOk) glass.floodTo(id, 1, 0.9);
    },
    onOpenChapel: function (id) {
      document.querySelectorAll(".lancet").forEach(function (el) {
        if (el.getAttribute("data-plate") !== id) el.classList.add("is-ember");
        else el.classList.remove("is-ember");
      });
      nave.stopScroll();
      chapel.show(id);
      if (webglOk) {
        canvas.classList.add("is-dim");
        caustics.setIntensity(0.45);
      }
    }
  });

  function onThresholdDone() {
    bootLight();
    nave.start();
    var leaveLine = document.querySelector("#leave .end-line");
    if (leaveLine && window.gsap && window.ScrollTrigger && !reduced) {
      window.gsap.to(leaveLine, {
        scaleX: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: "#leave", start: "top 70%" }
      });
    } else if (leaveLine) {
      leaveLine.style.transform = "scaleX(1)";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      NGLThreshold.play({ reduced: reduced, onDone: onThresholdDone });
    });
  } else {
    NGLThreshold.play({ reduced: reduced, onDone: onThresholdDone });
  }
})();
