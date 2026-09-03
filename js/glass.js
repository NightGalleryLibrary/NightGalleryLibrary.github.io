/* Stained-glass pass. One WebGL context, blit to each window canvas.
   Old-cathedral UV warp, edge chromatic, Persephone numbered→color flood.
   No Three.js. Relative URLs only. */
(function (global) {
  "use strict";

  var VERT = ""
    + "attribute vec2 aPos;"
    + "attribute vec2 aUv;"
    + "varying vec2 vUv;"
    + "void main(){"
    + "  vUv = aUv;"
    + "  gl_Position = vec4(aPos, 0.0, 1.0);"
    + "}";

  var FRAG = ""
    + "precision highp float;"
    + "varying vec2 vUv;"
    + "uniform sampler2D uTexA;"
    + "uniform sampler2D uTexB;"
    + "uniform float uHasB;"
    + "uniform float uFlood;"
    + "uniform vec2 uSun;"
    + "uniform float uTime;"
    + "uniform float uWarp;"
    + "uniform float uShape;"
    + "uniform vec2 uCrop;"
    + "uniform vec2 uCropOff;"
    + "uniform vec2 uPx;"
    + "float sdLancet(vec2 uv){"
    + "  vec2 p = vec2(uv.x, 1.0 - uv.y);"
    + "  float x = abs(p.x - 0.5);"
    + "  float hw = 0.465;"
    + "  if (p.y < 0.54) {"
    + "    float t = clamp((0.54 - p.y) / 0.528, 0.0, 1.0);"
    + "    hw = 0.465 * (1.0 - pow(t, 1.62));"
    + "  }"
    + "  float d = x - hw;"
    + "  d = max(d, 0.010 - p.y);"
    + "  d = max(d, p.y - 0.990);"
    + "  return d;"
    + "}"
    + "float windowMask(vec2 uv){"
    + "  if (uShape < 0.5) {"
    + "    float r = length(uv - vec2(0.5, 0.50));"
    + "    return 1.0 - smoothstep(0.492, 0.500, r);"
    + "  }"
    + "  return 1.0 - smoothstep(0.0, 0.0045, sdLancet(uv));"
    + "}"
    + "float edgeAmt(vec2 uv){"
    + "  if (uShape < 0.5) {"
    + "    float r = length(uv - vec2(0.5, 0.50));"
    + "    return smoothstep(0.455, 0.496, r);"
    + "  }"
    + "  return smoothstep(-0.014, 0.002, sdLancet(uv));"
    + "}"
    + "vec3 sampleRGB(sampler2D tex, vec2 uv, vec2 chroma){"
    + "  vec3 c;"
    + "  c.r = texture2D(tex, uv + chroma).r;"
    + "  c.g = texture2D(tex, uv).g;"
    + "  c.b = texture2D(tex, uv - chroma).b;"
    + "  return c;"
    + "}"
    + "void main(){"
    + "  vec2 uv = vUv;"
    + "  float mask = windowMask(uv);"
    + "  if (mask < 0.004) { gl_FragColor = vec4(0.0); return; }"
    + "  vec2 suv = uv * uCrop + uCropOff;"
    + "  float amp = mix(0.0015, 0.0045, 0.4);"
    + "  vec2 warp = uWarp * amp * vec2("
    + "    sin(suv.y * 17.0 + uTime * 0.31 + suv.x * 3.0),"
    + "    cos(suv.x * 13.0 + uTime * 0.22 + suv.y * 2.4)"
    + "  );"
    + "  vec2 guv = suv + warp;"
    + "  float edge = edgeAmt(uv);"
    + "  vec2 dir = guv - vec2(0.5);"
    + "  float ld = length(dir);"
    + "  dir = ld > 0.0001 ? dir / ld : vec2(0.0, 1.0);"
    + "  vec2 chroma = dir * uPx * mix(0.0, 1.1, edge);"
    + "  vec3 aCol = sampleRGB(uTexA, guv, chroma);"
    + "  vec3 outc = aCol;"
    + "  float floodMix = 1.0;"
    + "  if (uHasB > 0.5) {"
    + "    vec3 bCol = sampleRGB(uTexB, guv, chroma);"
    + "    vec2 fd = vec2(uSun.x, -uSun.y * 0.35 + 0.12);"
    + "    float fl = length(fd);"
    + "    fd = fl > 0.05 ? fd / fl : vec2(1.0, 0.15);"
    + "    float along = dot(uv - vec2(0.5), fd) * 0.72 + 0.5;"
    + "    floodMix = smoothstep(along - 0.07, along + 0.05, uFlood);"
    + "    outc = mix(aCol, bCol, floodMix);"
    + "    float front = exp(-pow((along - uFlood) * 16.0, 2.0));"
    + "    outc += front * 0.42 * vec3(0.92, 0.78, 0.32) * step(0.02, uFlood) * step(uFlood, 0.98);"
    + "  }"
    + "  float vit = 0.82 + 0.18 * (1.0 - edge);"
    + "  outc *= vit;"
    + "  vec2 sunN = uSun;"
    + "  float sl = length(sunN);"
    + "  sunN = sl > 0.04 ? sunN / sl : vec2(0.25, 0.6);"
    + "  float spec = pow(max(0.0, dot(dir, sunN)), 22.0);"
    + "  outc += spec * mix(0.08, 0.55, edge) * vec3(1.0, 0.93, 0.72);"
    + "  vec2 tanv = vec2(-sunN.y, sunN.x);"
    + "  float streak = exp(-pow(dot(uv - vec2(0.5), tanv) * 7.5, 2.0));"
    + "  outc += streak * (1.0 - edge) * 0.07 * vec3(0.98, 0.90, 0.72);"
    + "  gl_FragColor = vec4(outc * mask, mask);"
    + "}";

  function Glass() {
    this.ok = false;
    this.paused = false;
    this.reduced = false;
    this.gl = null;
    this.prog = null;
    this.locs = {};
    this.canvas = null;
    this.windows = [];
    this.sun = { x: 0.12, y: 0.34 };
    this._raf = 0;
    this._t0 = 0;
    this._loop = this._loop.bind(this);
    this._quad = null;
  }

  Glass.prototype.init = function (opts) {
    opts = opts || {};
    this.reduced = !!opts.reduced;
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = 4;
    canvas.height = 4;
    canvas.style.cssText = "position:absolute;left:-9999px;top:0;width:1px;height:1px;pointer-events:none;";
    document.body.appendChild(canvas);
    this.canvas = canvas;

    var gl = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true
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
    gl.bindAttribLocation(p, 1, "aUv");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    this.prog = p;

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
      -1,  1, 0, 1,
       1, -1, 1, 0,
       1,  1, 1, 1
    ]), gl.STATIC_DRAW);
    this._quad = buf;

    var names = [
      "uTexA", "uTexB", "uHasB", "uFlood", "uSun", "uTime",
      "uWarp", "uShape", "uCrop", "uCropOff", "uPx"
    ];
    for (var i = 0; i < names.length; i++) {
      this.locs[names[i]] = gl.getUniformLocation(p, names[i]);
    }

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this.ok = true;
    this._bindWindows();
    this._observe();

    document.addEventListener("visibilitychange", function () {
      this.paused = document.hidden;
    }.bind(this));
    window.addEventListener("resize", this._onResize.bind(this));
    return true;
  };

  Glass.prototype._shader = function (type, src) {
    var gl = this.gl;
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  };

  Glass.prototype._bindWindows = function () {
    var self = this;
    var rose = document.querySelector(".rose-aperture");
    if (rose) {
      this._attach(rose, {
        id: "rose",
        shape: 0,
        crop: [1.0, 1.0],
        cropOff: [0.0, 0.0],
        imgA: rose.querySelector("img"),
        imgB: null
      });
    }
    var lancets = document.querySelectorAll(".lancet");
    for (var i = 0; i < lancets.length; i++) {
      var el = lancets[i];
      var id = el.getAttribute("data-plate");
      var glass = el.querySelector(".lancet-glass");
      if (!glass) continue;
      var color = glass.querySelector(".plate-color");
      var number = glass.querySelector(".plate-number");
      var kind = el.getAttribute("data-kind") || "color";
      var img = kind === "number" ? (number || color) : (color || number);
      this._attach(glass, {
        id: id + "-" + kind,
        shape: 1,
        crop: [0.86, 0.78],
        cropOff: [0.07, 0.13],
        imgA: img,
        imgB: null,
        flood: 1
      });
    }
  };

  Glass.prototype._attach = function (host, spec) {
    if (!host) return;
    var c = document.createElement("canvas");
    c.className = "glass-pass";
    c.setAttribute("aria-hidden", "true");
    host.appendChild(c);
    var win = {
      id: spec.id,
      host: host,
      canvas: c,
      ctx: c.getContext("2d"),
      shape: spec.shape,
      crop: spec.crop || [1, 1],
      cropOff: spec.cropOff || [0, 0],
      imgA: spec.imgA,
      imgB: spec.imgB,
      texA: null,
      texB: null,
      flood: spec.flood == null ? 1 : spec.flood,
      visible: true,
      ready: false,
      watch: null
    };
    this.windows.push(win);
    this._loadTex(win);
    this._sizeWin(win);
  };

  Glass.prototype._texFromImg = function (img) {
    var gl = this.gl;
    if (!img || !img.naturalWidth) return null;
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } catch (e) {
      gl.deleteTexture(t);
      return null;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  Glass.prototype._loadTex = function (win) {
    var self = this;
    function grab(img, key) {
      if (!img) return;
      function up() {
        if (!self.ok) return;
        var t = self._texFromImg(img);
        if (t) {
          win[key] = t;
          win.ready = !!win.texA && (!win.imgB || !!win.texB);
          if (win.ready) win.host.classList.add("is-glazed");
        }
      }
      if (img.complete && img.naturalWidth) up();
      else img.addEventListener("load", up);
    }
    grab(win.imgA, "texA");
    grab(win.imgB, "texB");
  };

  Glass.prototype._backingScale = function () {
    var w = window.innerWidth || 800;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var scale = w < 800 ? 0.5 : 1;
    return dpr * scale;
  };

  Glass.prototype._sizeWin = function (win) {
    var r = win.host.getBoundingClientRect();
    var s = this._backingScale();
    var bw = Math.max(2, Math.floor(r.width * s));
    var bh = Math.max(2, Math.floor(r.height * s));
    if (win.canvas.width !== bw || win.canvas.height !== bh) {
      win.canvas.width = bw;
      win.canvas.height = bh;
    }
    win.canvas.style.width = "100%";
    win.canvas.style.height = "100%";
  };

  Glass.prototype._onResize = function () {
    if (!this.ok) return;
    for (var i = 0; i < this.windows.length; i++) this._sizeWin(this.windows[i]);
  };

  Glass.prototype._observe = function () {
    var self = this;
    if (!global.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        for (var j = 0; j < self.windows.length; j++) {
          if (self.windows[j].watch === e.target) {
            self.windows[j].visible = e.isIntersecting;
          }
        }
      }
    }, { rootMargin: "12% 0px" });
    for (var i = 0; i < this.windows.length; i++) {
      var el = this.windows[i].host.closest(".bay") || this.windows[i].host;
      this.windows[i].watch = el;
      io.observe(el);
    }
  };

  Glass.prototype.setSun = function (x, y) {
    this.sun.x = x;
    this.sun.y = y;
  };

  Glass.prototype.win = function (id) {
    for (var i = 0; i < this.windows.length; i++) {
      if (this.windows[i].id === id) return this.windows[i];
    }
    return null;
  };

  Glass.prototype.setFlood = function (id, v) {
    var w = this.win(id);
    if (w) w.flood = v;
  };

  Glass.prototype.floodTo = function (id, v, dur) {
    var w = this.win(id);
    if (!w) return;
    if (this.reduced || !global.gsap) {
      w.flood = v;
      return;
    }
    global.gsap.to(w, {
      flood: v,
      duration: dur == null ? 0.85 : dur,
      ease: "expo.out",
      overwrite: true
    });
  };

  Glass.prototype.start = function () {
    if (!this.ok) return;
    this._t0 = performance.now();
    if (this.reduced) {
      this._drawAll(0);
      return;
    }
    if (!this._raf) this._raf = requestAnimationFrame(this._loop);
  };

  Glass.prototype.stop = function () {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  };

  Glass.prototype._loop = function (now) {
    this._raf = requestAnimationFrame(this._loop);
    if (this.paused || document.hidden) return;
    this._drawAll((now - this._t0) / 1000);
  };

  Glass.prototype._ensureGlSize = function (w, h) {
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
  };

  Glass.prototype._drawAll = function (time) {
    var gl = this.gl;
    if (!gl || !this.ok) return;
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    var warp = this.reduced ? 0 : 1;
    for (var i = 0; i < this.windows.length; i++) {
      var win = this.windows[i];
      if (!win.ready || !win.visible || !win.texA) continue;
      this._drawWin(win, time, warp);
    }
  };

  Glass.prototype._drawWin = function (win, time, warp) {
    var gl = this.gl;
    var w = win.canvas.width;
    var h = win.canvas.height;
    if (w < 2 || h < 2) return;
    this._ensureGlSize(w, h);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, win.texA);
    gl.uniform1i(this.locs.uTexA, 0);

    var hasB = win.texB ? 1 : 0;
    if (hasB) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, win.texB);
      gl.uniform1i(this.locs.uTexB, 1);
    }
    gl.uniform1f(this.locs.uHasB, hasB);
    gl.uniform1f(this.locs.uFlood, win.flood);
    gl.uniform2f(this.locs.uSun, this.sun.x, this.sun.y);
    gl.uniform1f(this.locs.uTime, time);
    gl.uniform1f(this.locs.uWarp, warp);
    gl.uniform1f(this.locs.uShape, win.shape);
    gl.uniform2f(this.locs.uCrop, win.crop[0], win.crop[1]);
    gl.uniform2f(this.locs.uCropOff, win.cropOff[0], win.cropOff[1]);
    gl.uniform2f(this.locs.uPx, 1.0 / w, 1.0 / h);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    try {
      win.ctx.globalCompositeOperation = "copy";
      win.ctx.drawImage(this.canvas, 0, 0, w, h);
    } catch (e) {}
  };

  global.NGLGlass = Glass;
})(window);
