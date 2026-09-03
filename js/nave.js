(function (global) {
  "use strict";

  function Nave(opts) {
    this.reduced = !!opts.reduced;
    this.lenis = null;
    this.onOpenChapel = opts.onOpenChapel || function () {};
    this.onGhost = opts.onGhost || function () {};
    this.onFlood = opts.onFlood || function () {};
    this.onGhostCancel = opts.onGhostCancel || function () {};
    this.onScroll = opts.onScroll || function () {};
    this._flooded = {};
    this._press = null;
  }

  Nave.prototype.start = function () {
    var self = this;
    var lancets = document.querySelectorAll(".lancet");

    if (!this.reduced && global.Lenis && global.gsap && global.ScrollTrigger) {
      global.gsap.registerPlugin(global.ScrollTrigger);
      var Lenis = global.Lenis;
      this.lenis = new Lenis({
        duration: 1.15,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.1,
        autoRaf: false
      });
      this.lenis.on("scroll", function (e) {
        global.ScrollTrigger.update();
        var limit = self.lenis.limit || 1;
        var p = limit ? self.lenis.scroll / limit : 0;
        self.onScroll(p);
      });
      global.gsap.ticker.add(function (time) { self.lenis.raf(time * 1000); });
      global.gsap.ticker.lagSmoothing(0);

      lancets.forEach(function (el) {
        global.ScrollTrigger.create({
          trigger: el,
          start: "top 78%",
          end: "bottom 22%",
          onEnter: function () { el.classList.add("is-attending"); },
          onEnterBack: function () { el.classList.add("is-attending"); }
        });
      });
    } else {
      lancets.forEach(function (el) { el.classList.add("is-attending", "is-lit"); });
      window.addEventListener("scroll", function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        self.onScroll(max > 0 ? window.scrollY / max : 0);
      }, { passive: true });
    }

    lancets.forEach(function (el) {
      self._bindLancet(el);
    });
  };

  Nave.prototype.stopScroll = function () {
    if (this.lenis) this.lenis.stop();
    document.body.classList.add("is-chapel");
  };

  Nave.prototype.startScroll = function () {
    if (this.lenis) this.lenis.start();
    document.body.classList.remove("is-chapel");
    if (global.ScrollTrigger) global.ScrollTrigger.refresh();
  };

  Nave.prototype._bindLancet = function (el) {
    var self = this;
    var id = el.getAttribute("data-plate");
    var MOVE = 14;

    function down(e) {
      if (e.type === "keydown") {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        self._onCommit(el, id);
        return;
      }
      if (e.button != null && e.button !== 0) return;
      var t = e.touches && e.touches[0] ? e.touches[0] : e;
      self._press = {
        id: id,
        el: el,
        x: t.clientX || 0,
        y: t.clientY || 0,
        moved: false
      };
      if (id === "persephone" && !self._flooded.persephone && !self.reduced) {
        el.classList.add("is-ghosting");
        self.onGhost(id);
      }
    }

    function move(e) {
      if (!self._press || self._press.el !== el) return;
      var t = e.touches && e.touches[0] ? e.touches[0] : e;
      var dx = (t.clientX || 0) - self._press.x;
      var dy = (t.clientY || 0) - self._press.y;
      if (dx * dx + dy * dy > MOVE * MOVE) {
        self._press.moved = true;
        el.classList.remove("is-ghosting");
        if (id === "persephone" && !self._flooded.persephone) self.onGhostCancel(id);
      }
    }

    function up(e) {
      if (!self._press || self._press.el !== el) return;
      var moved = self._press.moved;
      var pressEl = self._press.el;
      var pressId = self._press.id;
      self._press = null;
      if (moved) {
        pressEl.classList.remove("is-ghosting");
        if (pressId === "persephone" && !self._flooded.persephone) self.onGhostCancel(pressId);
        return;
      }
      self._onCommit(pressEl, pressId);
    }

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("keydown", down);
  };

  Nave.prototype._onCommit = function (el, id) {
    if (id === "persephone" && !this._flooded.persephone && !this.reduced) {
      el.classList.remove("is-ghosting");
      el.classList.add("is-flooding", "is-lit");
      this._flooded.persephone = true;
      this.onFlood(id);
      return;
    }
    if (id === "persephone" && !this._flooded.persephone && this.reduced) {
      this._flooded.persephone = true;
      el.classList.add("is-lit", "is-flooding");
      this.onFlood(id);
    }
    this.onOpenChapel(id);
  };

  global.NGLNave = Nave;
})(window);
