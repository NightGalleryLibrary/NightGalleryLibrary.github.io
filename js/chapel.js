(function (global) {
  "use strict";

  var ORDER = ["persephone", "medusa", "fenrir", "baba-yaga", "phoenix", "valkyrie", "hecate", "circe"];
  var EASE = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };

  var COPY = {
    persephone: {
      name: "Persephone",
      epithet: "six seeds, and the year divides",
      hero: "plates/persephone-color-hero.jpg",
      blur: "plates/persephone-color-blur.jpg",
      p1: "The earth split at Enna. Kore stooped to a narcissus of a hundred heads, and Aidoneus took her by the waist into the dark. Six seeds of the pomegranate he pressed upon her. Hermes led her back into the light, but those seeds held a third of the year, and the furrows learned to wait.",
      p2: "Each appointed season she takes the fruit and descends. Wheat withers. Demeter's grief returns until the soil lies barren. She rises then with the blooming narcissus, meadows opening as grain follows her. Always she is leaving one house as she arrives in the other. The year turns on that passage."
    },
    medusa: {
      name: "Medusa",
      epithet: "with somewhere to be",
      hero: "plates/medusa-hero.jpg",
      blur: "plates/medusa-blur.jpg",
      p1: "Poseidon lay with her in Athena's precinct. The goddess turned her anger on the mortal, not the god. Snakes the colour of old stone coiled in her hair, and she fled the cities of men until she came to the western rocks. Perseus came out of Seriphos with a bronze shield, and would not meet her eyes.",
      p2: "The marble still holds the last beauty that brought a god to the temple. From the wound sprang Pegasus. Athena took the dripping head and fixed it on her aegis. The soldier below is already stone, his hand raised as if the glance caught him turning from the columns."
    },
    fenrir: {
      name: "Fenrir",
      epithet: "a god's hand still in his mouth",
      hero: "plates/fenrir-hero.jpg",
      blur: "plates/fenrir-blur.jpg",
      p1: "Leyding snapped. Dromi tore. The Aesir ferried him to Lyngvi and offered Gleipnir, a ribbon the dwarves had spun from six impossibilities. He consented only when Tyr laid his right hand in the open jaws as surety. The slender fetter held. Those jaws closed on the hand that had been pledged.",
      p2: "Bound still, he strains through the long years. The northern pines have drawn closer about the island, their shadows always crossing the open mouth. At Ragnarok the ribbon fails, and the wolf swallows Odin."
    },
    "baba-yaga": {
      name: "Baba Yaga",
      epithet: "the house stands on chicken legs",
      hero: "plates/baba-yaga-hero.jpg",
      blur: "plates/baba-yaga-blur.jpg",
      p1: "The hut stands on chicken legs and turns to face the path. Skulls burn in the fence. She arrives in a mortar, steering with a pestle, sweeping her traces with a broom. Iron teeth. She scents Russian blood and shuts the girl inside, then sets tasks no mortal could finish by dawn.",
      p2: "Vasilisa's doll did the work unseen. The witch tore a burning skull from the fence and thrust it at the girl so fire might return with her. The sockets turned on those who had sent her, and the three burned to ash."
    },
    phoenix: {
      name: "Phoenix",
      epithet: "five hundred years, then fire",
      hero: "plates/phoenix-hero.jpg",
      blur: "plates/phoenix-blur.jpg",
      p1: "Out of Arabia, when five hundred years have passed, it comes heavy with cassia and myrrh and heaps its nest upon the sun-altar at Heliopolis. It lies down among the spices. The disk of the sun climbs. The flame takes the old bird whole, and cinnamon fills the court.",
      p2: "From the ring of fire another bird stands already, gold at the breast, scarlet in the wing. It circles once, takes up what bone remains, and turns for Arabia with the parent sealed in myrrh. The priests begin their five hundred years again."
    },
    valkyrie: {
      name: "Valkyrie",
      epithet: "she names who rides north",
      hero: "plates/valkyrie-hero.jpg",
      blur: "plates/valkyrie-blur.jpg",
      p1: "When the armies lock and the first men fall, Odin looses his maidens. She comes down through hail on a winged horse, spear leveled, the wings of her helm catching what light remains. She hangs above the slaughter and names those who shall sit with the Einherjar.",
      p2: "The chosen are lifted from the bloodied grass and borne north to the benches. Those she does not choose she leaves where the steel put them. After she has spoken she climbs the storm again. The northern lights stand in long pale sheets, as though the night had been torn open."
    },
    hecate: {
      name: "Hecate",
      epithet: "three faces at the joining",
      hero: "plates/hecate-hero.jpg",
      blur: "plates/hecate-blur.jpg",
      p1: "From her cave among the hills above Enna she heard Kore cry out. She came forth with twin torches and walked nine days at Demeter's side until Helios named the taker. The keys of the two realms were placed in her hands. She took station where three paths join.",
      p2: "Night after night she keeps the post. Three faces, each turned to a road. Twin torches showing the choice. The black dog at her feet turns its ears to the dark that gathers at the divide. Whoever reaches the joining after sunset feels her regard before choosing."
    },
    circe: {
      name: "Circe",
      epithet: "the bronze bowl, and the year they stayed",
      hero: "plates/circe-hero.jpg",
      blur: "plates/circe-blur.jpg",
      p1: "The last black ship grounded on Aeaea. She sat in her hall among tame wolves and welcomed the men, stirring Pramnian wine with cheese, honey, and barley in her bronze bowl. They drank, and hair covered their limbs. Hermes met Odysseus on the path and gave him the white flower moly.",
      p2: "Once the companions stood upright they remained a year in that hall. The loom unfinished at her back. Herbs drying in the smoke. Wolves asleep in the court. When they begged for Ithaca she walked him down to the black ship and told him he must sail Oceanus first."
    }
  };

  function Chapel(opts) {
    this.reduced = !!opts.reduced;
    this.onClose = opts.onClose || function () {};
    this.onChange = opts.onChange || function () {};
    this.index = 0;
    this.open = false;
    this._fromEl = null;
    this._busy = false;
    this.el = document.getElementById("chapel");
    this.glass = this.el ? this.el.querySelector(".chapel-glass") : null;
    this.missal = this.el ? this.el.querySelector(".chapel-missal") : null;
    this._bind();
  }

  Chapel.prototype._bind = function () {
    var self = this;
    var ret = document.getElementById("chapelReturn");
    if (ret) ret.addEventListener("click", function () { self.close(); });

    var sx = 0, sy = 0, tracking = false;
    this.el.addEventListener("pointerdown", function (e) {
      if (e.target.closest && e.target.closest(".chapel-return")) return;
      tracking = true;
      sx = e.clientX;
      sy = e.clientY;
    });
    this.el.addEventListener("pointerup", function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.clientX - sx;
      var dy = e.clientY - sy;
      if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
        self.close();
        return;
      }
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) self.next();
        else self.prev();
      }
    });
    this.el.addEventListener("pointercancel", function () { tracking = false; });

    window.addEventListener("keydown", function (e) {
      if (!self.open) return;
      if (e.key === "Escape") self.close();
      if (e.key === "ArrowRight") self.next();
      if (e.key === "ArrowLeft") self.prev();
      if (e.key === "ArrowDown") self.close();
    });
  };

  Chapel.prototype._source = function (id) {
    return document.querySelector('.lancet[data-plate="' + id + '"]');
  };

  Chapel.prototype.show = function (id) {
    var i = ORDER.indexOf(id);
    if (i < 0) i = 0;
    this.index = i;
    this.open = true;
    this._fromEl = this._source(ORDER[i]);
    this.el.hidden = false;
    this.el.classList.add("is-open");
    this.el.removeAttribute("hidden");
    this._render(false);
    this.onChange(ORDER[this.index]);
    this._morphIn();
  };

  Chapel.prototype._morphIn = function () {
    var gsap = global.gsap;
    var glass = this.glass;
    var missal = this.missal;
    var src = this._fromEl;
    if (!glass) return;

    if (this.reduced || !gsap || !src) {
      if (glass) {
        glass.style.transform = "";
        glass.style.opacity = "1";
      }
      if (missal) missal.style.opacity = "1";
      return;
    }

    var self = this;
    requestAnimationFrame(function () {
      var s = src.getBoundingClientRect();
      var d = glass.getBoundingClientRect();
      if (!d.width || !s.width) return;
      var dx = s.left - d.left;
      var dy = s.top - d.top;
      var sx = s.width / d.width;
      var sy = s.height / d.height;
      gsap.set(glass, { transformOrigin: "0% 0%", x: dx, y: dy, scaleX: sx, scaleY: sy, opacity: 1 });
      if (missal) gsap.set(missal, { opacity: 0, y: 18 });
      gsap.set(self.el, { backgroundColor: "rgba(5,7,12,0)" });
      gsap.to(glass, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.95, ease: EASE, overwrite: true });
      if (missal) gsap.to(missal, { opacity: 1, y: 0, duration: 0.7, delay: 0.28, ease: EASE });
      gsap.to(self.el, { backgroundColor: "rgba(5,7,12,1)", duration: 0.7, ease: EASE });
    });
  };

  Chapel.prototype.close = function () {
    if (!this.open || this._busy) return;
    var self = this;
    var gsap = global.gsap;
    var glass = this.glass;
    var src = this._fromEl || this._source(ORDER[this.index]);

    function finish() {
      self.open = false;
      self.el.classList.remove("is-open");
      self.el.hidden = true;
      self.el.setAttribute("hidden", "");
      if (glass) {
        glass.style.transform = "";
        glass.style.opacity = "";
      }
      self.onClose();
    }

    if (this.reduced || !gsap || !src || !glass) {
      finish();
      return;
    }

    this._busy = true;
    var s = src.getBoundingClientRect();
    var d = glass.getBoundingClientRect();
    var dx = s.left - d.left;
    var dy = s.top - d.top;
    var sx = s.width / Math.max(1, d.width);
    var sy = s.height / Math.max(1, d.height);

    if (this.missal) gsap.to(this.missal, { opacity: 0, y: 10, duration: 0.28, ease: EASE });
    gsap.to(this.el, { backgroundColor: "rgba(5,7,12,0)", duration: 0.55, ease: EASE });
    gsap.to(glass, {
      x: dx,
      y: dy,
      scaleX: sx,
      scaleY: sy,
      duration: 0.7,
      ease: EASE,
      overwrite: true,
      onComplete: function () {
        self._busy = false;
        finish();
      }
    });
  };

  Chapel.prototype.next = function () {
    this.index = (this.index + 1) % ORDER.length;
    this._fromEl = this._source(ORDER[this.index]);
    this._render(true, 1);
    this.onChange(ORDER[this.index]);
  };

  Chapel.prototype.prev = function () {
    this.index = (this.index - 1 + ORDER.length) % ORDER.length;
    this._fromEl = this._source(ORDER[this.index]);
    this._render(true, -1);
    this.onChange(ORDER[this.index]);
  };

  Chapel.prototype._render = function (swipe, dir) {
    var id = ORDER[this.index];
    var c = COPY[id];
    document.getElementById("chapelName").textContent = c.name;
    document.getElementById("chapelEpithet").textContent = c.epithet;
    document.getElementById("chapelP1").textContent = c.p1;
    document.getElementById("chapelP2").textContent = c.p2;
    var hero = document.getElementById("chapelHero");
    var emit = document.getElementById("chapelEmit");
    hero.style.backgroundImage = "url('" + c.blur + "')";
    hero.innerHTML = "";
    var img = document.createElement("img");
    img.src = c.hero;
    img.alt = c.name;
    hero.appendChild(img);
    emit.style.backgroundImage = "url('" + c.blur + "')";

    var gsap = global.gsap;
    if (swipe && gsap && !this.reduced && this.glass) {
      var dx = (dir || 1) * 36;
      gsap.fromTo(this.glass, { x: dx, opacity: 0.55 }, { x: 0, opacity: 1, duration: 0.55, ease: EASE, overwrite: true });
      if (this.missal) {
        gsap.fromTo(this.missal, { opacity: 0.2, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE });
      }
    }
  };

  global.NGLChapel = Chapel;
  global.NGL_PLATES = { ORDER: ORDER, COPY: COPY };
})(window);
