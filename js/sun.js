/* Damped sun. Pointer on desktop, drag on the floor on phone.
   Scroll walks the aisle (uSun.x). Tilt only after a gesture. */
(function (global) {
  "use strict";

  function Sun() {
    this.target = { x: 0.12, y: 0.34 };
    this.current = { x: 0.12, y: 0.34 };
    this.mix = 0.08;
    this.scrollX = 0;
    this.tiltArmed = false;
    this.tiltLive = false;
    this.gamma0 = 0;
    this.beta0 = 0;
    this._onOrient = this._onOrient.bind(this);
  }

  Sun.prototype.get = function () {
    return this.current;
  };

  Sun.prototype.setTarget = function (x, y) {
    this.target.x = Math.max(-1, Math.min(1, x));
    this.target.y = Math.max(-1, Math.min(1, y));
  };

  Sun.prototype.setScroll = function (progress) {
    if (progress == null || isNaN(progress)) return;
    this.scrollX = Math.max(0, Math.min(1, progress)) * 2 - 1;
  };

  Sun.prototype.fromPointer = function (clientX, clientY) {
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    this.setTarget((clientX / w) * 2 - 1, (clientY / h) * 2 - 1);
  };

  Sun.prototype.tick = function () {
    var tx = this.target.x + this.scrollX * 0.38;
    if (tx > 1) tx = 1;
    if (tx < -1) tx = -1;
    this.current.x += (tx - this.current.x) * this.mix;
    this.current.y += (this.target.y - this.current.y) * this.mix;
    return this.current;
  };

  Sun.prototype.bindFloor = function (el) {
    var self = this;
    var dragging = false;

    function point(e) {
      var t = e.touches && e.touches[0] ? e.touches[0] : e;
      self.fromPointer(t.clientX, t.clientY);
    }

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch" && !dragging) return;
      if (e.pointerType === "mouse" || dragging) point(e);
    }, { passive: true });

    el.addEventListener("pointerdown", function (e) {
      dragging = true;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      point(e);
    });
    el.addEventListener("pointerup", function () { dragging = false; });
    el.addEventListener("pointercancel", function () { dragging = false; });

    el.addEventListener("touchmove", function (e) {
      dragging = true;
      point(e);
    }, { passive: true });
  };

  Sun.prototype.armTilt = function () {
    this.tiltArmed = true;
  };

  Sun.prototype.enableTilt = function () {
    var self = this;
    if (this.tiltLive) return Promise.resolve(true);
    var DOE = window.DeviceOrientationEvent;
    if (!DOE) return Promise.resolve(false);

    function start() {
      window.addEventListener("deviceorientation", self._onOrient, true);
      self.tiltLive = true;
      return true;
    }

    if (typeof DOE.requestPermission === "function") {
      return DOE.requestPermission().then(function (state) {
        if (state === "granted") return start();
        return false;
      }).catch(function () { return false; });
    }
    start();
    return Promise.resolve(true);
  };

  Sun.prototype._onOrient = function (e) {
    if (!this.tiltLive) return;
    var g = e.gamma;
    var b = e.beta;
    if (g == null || b == null) return;
    if (!this.gamma0 && !this.beta0) {
      this.gamma0 = g;
      this.beta0 = b;
    }
    var x = (g - this.gamma0) / 35;
    var y = (b - this.beta0) / 45;
    this.setTarget(x, y);
  };

  Sun.prototype.disableTilt = function () {
    window.removeEventListener("deviceorientation", this._onOrient, true);
    this.tiltLive = false;
  };

  global.NGLSun = Sun;
})(window);
