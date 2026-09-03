/* One fullscreen canvas. Warped-sine puddles plus a stained projection
   of the rose onto the floor. No Three.js. Pause when hidden. */
(function (global) {
  "use strict";

  var VERT = ""
    + "attribute vec2 aPos;"
    + "void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }";

  var FRAG = ""
    + "precision highp float;"
    + "uniform vec2 uRes;"
    + "uniform vec2 uSun;"
    + "uniform float uTime;"
    + "uniform float uIntensity;"
    + "uniform vec3 uC0;"
    + "uniform vec3 uC1;"
    + "uniform vec3 uC2;"
    + "uniform vec3 uC3;"
    + "uniform vec3 uC4;"
    + "uniform sampler2D uRose;"
    + "uniform float uHasRose;"
    + "void main(){"
    + "  vec2 uv = gl_FragCoord.xy / uRes;"
    + "  uv.y = 1.0 - uv.y;"
    + "  vec3 pal[5];"
    + "  pal[0]=uC0; pal[1]=uC1; pal[2]=uC2; pal[3]=uC3; pal[4]=uC4;"
    + "  vec3 col = vec3(0.0);"
    + "  for (int i = 0; i < 5; i++) {"
    + "    float fi = float(i);"
    + "    vec2 p = uv * (3.0 + fi * 1.7);"
    + "    p += 0.35 * sin(p.yx + uSun * 2.0 + uTime * 0.07 + fi * 0.9);"
    + "    float c = smoothstep(0.35, 0.85, sin(p.x) * sin(p.y));"
    + "    col += c * pal[i] * 0.22;"
    + "  }"
    + "  vec2 axis = vec2(0.50 + uSun.x * 0.18, 0.36 + uSun.y * 0.08);"
    + "  float dist = length((uv - axis) * vec2(1.0, 1.35));"
    + "  float cone = pow(max(0.0, 1.0 - dist * 1.35), 2.2);"
    + "  float floorMask = smoothstep(0.48, 0.62, uv.y);"
    + "  if (uHasRose > 0.5) {"
    + "    vec2 ruv = (uv - axis) * vec2(1.55, 2.35) + vec2(0.5, 0.46);"
    + "    ruv += 0.012 * sin(ruv.yx * 9.0 + uSun + uTime * 0.11);"
    + "    float inWin = 1.0 - smoothstep(0.36, 0.52, length(ruv - vec2(0.5)));"
    + "    vec3 stained = texture2D(uRose, clamp(ruv, 0.0, 1.0)).rgb;"
    + "    col += stained * stained * inWin * 0.62;"
    + "  }"
    + "  col *= cone * floorMask * uIntensity;"
    + "  gl_FragColor = vec4(col, 1.0);"
    + "}";

  var GOLD = [0.788, 0.635, 0.153];
  var BURG = [0.502, 0.094, 0.153];
  var TEAL = [0.102, 0.416, 0.416];
  var WINE = [0.447, 0.145, 0.251];
  var PEACH = [0.910, 0.706, 0.557];

  function hex3(h) {
    var n = parseInt(h.replace("#", ""), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function Caustics(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.prog = null;
    this.ok = false;
    this.paused = false;
    this.intensity = 0;
    this.sun = { x: 0.12, y: 0.34 };
    this.palette = [GOLD, BURG, TEAL, WINE, PEACH];
    this._raf = 0;
    this._t0 = 0;
    this.locs = {};
    this._loop = this._loop.bind(this);
    this.roseTex = null;
    this.hasRose = 0;
  }

  Caustics.prototype.init = function () {
    var canvas = this.canvas;
    var gl = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false
      });
    } catch (e) {
      gl = null;
    }
    if (!gl) return false;
    this.gl = gl;

    var vs = this._shader(gl.VERTEX_SHADER, VERT);
    var fs = this._shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    this.prog = p;

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var names = ["uRes", "uSun", "uTime", "uIntensity", "uC0", "uC1", "uC2", "uC3", "uC4", "uRose", "uHasRose"];
    for (var i = 0; i < names.length; i++) {
      this.locs[names[i]] = gl.getUniformLocation(p, names[i]);
    }

    this.ok = true;
    this.resize();
    this._loadRose();
    window.addEventListener("resize", this.resize.bind(this));
    document.addEventListener("visibilitychange", function () {
      this.paused = document.hidden;
    }.bind(this));
    return true;
  };

  Caustics.prototype._loadRose = function () {
    var self = this;
    var img = document.querySelector(".rose-aperture img");
    function upload(src) {
      if (!self.ok || !src || !src.naturalWidth) return;
      var gl = self.gl;
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
      } catch (e) {
        return;
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      self.roseTex = t;
      self.hasRose = 1;
    }
    if (img) {
      if (img.complete && img.naturalWidth) upload(img);
      else img.addEventListener("load", function () { upload(img); });
    } else {
      var fresh = new Image();
      fresh.onload = function () { upload(fresh); };
      fresh.src = "plates/rose-roundel-hero.jpg";
    }
  };

  Caustics.prototype._shader = function (type, src) {
    var gl = this.gl;
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  };

  Caustics.prototype.resize = function () {
    if (!this.ok) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var scale = w < 800 ? 0.5 : 1;
    var bw = Math.max(1, Math.floor(w * dpr * scale));
    var bh = Math.max(1, Math.floor(h * dpr * scale));
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
      this.gl.viewport(0, 0, bw, bh);
    }
  };

  Caustics.prototype.setSun = function (x, y) {
    this.sun.x = x;
    this.sun.y = y;
  };

  Caustics.prototype.setIntensity = function (v) {
    this.intensity = v;
  };

  Caustics.prototype.setPalette = function (hexes) {
    if (!hexes || hexes.length < 5) return;
    this.palette = hexes.map(hex3);
  };

  Caustics.prototype.start = function () {
    if (!this.ok) return;
    this.canvas.classList.add("is-live");
    this._t0 = performance.now();
    if (!this._raf) this._raf = requestAnimationFrame(this._loop);
  };

  Caustics.prototype.stop = function () {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  };

  Caustics.prototype._loop = function (now) {
    this._raf = requestAnimationFrame(this._loop);
    if (this.paused || document.hidden) return;
    var gl = this.gl;
    gl.useProgram(this.prog);
    gl.uniform2f(this.locs.uRes, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.locs.uSun, this.sun.x, this.sun.y);
    gl.uniform1f(this.locs.uTime, (now - this._t0) / 1000);
    gl.uniform1f(this.locs.uIntensity, this.intensity);
    var pal = this.palette;
    gl.uniform3fv(this.locs.uC0, pal[0]);
    gl.uniform3fv(this.locs.uC1, pal[1]);
    gl.uniform3fv(this.locs.uC2, pal[2]);
    gl.uniform3fv(this.locs.uC3, pal[3]);
    gl.uniform3fv(this.locs.uC4, pal[4]);
    if (this.roseTex) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.roseTex);
      gl.uniform1i(this.locs.uRose, 0);
      gl.uniform1f(this.locs.uHasRose, 1);
    } else {
      gl.uniform1f(this.locs.uHasRose, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  global.NGLCaustics = Caustics;
})(window);
