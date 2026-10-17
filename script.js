/* Thejovati Portfolio: vanilla JS port of the Claude Design component logic. */
(function () {
  'use strict';

  var TASTES = [
    { key: 'sweet', name: 'Sweet', hue: 0, holds: 'About me', persona: 'The warm one',
      line: "Sweet comes first on the plate, so it comes first here too. This is me, before any of the work." },
    { key: 'salty', name: 'Salty', hue: 225, holds: 'Skills', persona: 'The essentials',
      line: "Salt goes into everything. These are the tools I reach for on almost every project." },
    { key: 'pungent', name: 'Pungent', hue: 40, holds: 'Projects', persona: 'The bold one',
      line: "Pungent is the kick you remember after the meal. These are nine things I've built, from an accepted paper to a dashboard of my own Spotify history. Open any one for the details." },
    { key: 'sour', name: 'Sour', hue: 105, holds: 'Experience', persona: 'The real-world one',
      line: "Sour is the taste that wakes you up. My internships are where coursework met real problems, real data and real deadlines." },
    { key: 'bitter', name: 'Bitter', hue: 300, holds: 'Leadership', persona: 'The steady one',
      line: "Bitter takes time to appreciate, and so does leadership. This is where I learned to manage people, partners and a brand." },
    { key: 'astringent', name: 'Astringent', hue: 150, holds: 'Beyond class', persona: 'The grounded one',
      line: "Astringent is the clean, dry finish that balances a meal. These are the things outside the classroom that keep me balanced." }
  ];

  var DISHES = [
    { dish: 'Kheer', line: "Mmm, kheer. Sweet, warm, a little extra. That's me." },
    { dish: 'Papad', line: 'Crunchy and salty. It goes with everything, just like my skills.' },
    { dish: 'Pepper rasam', line: 'Whoa, spicy! These projects have a kick.' },
    { dish: 'Tamarind curry', line: 'So tangy! It wakes you right up, like my internships did.' },
    { dish: 'Bitter gourd stir fry', line: 'Ugh, bitter gourd. Leadership is an acquired taste too.' },
    { dish: 'Raw banana stir fry', line: 'Dry and earthy. It keeps me grounded, like life outside class.' }
  ];

  // Facial expressions drawn over the avatar, one per taste.
  var EXPR = {
    neutral: { bl: 'M70 84 Q82 79 93 83', br: 'M107 83 Q118 79 130 84', eyes: 'open', mouth: 'M88 127 Q100 135 112 127', blush: .25 },
    sweet: { bl: 'M70 80 Q82 74 93 79', br: 'M107 79 Q118 74 130 80', eyes: 'happy', mouth: 'M84 122 Q100 146 116 122 Q100 129 84 122 Z', fill: true, blush: .65 },
    salty: { bl: 'M70 79 Q82 71 93 78', br: 'M107 86 Q118 84 130 87', eyes: 'smirk', mouth: 'M89 129 Q104 132 114 121', blush: .25 },
    pungent: { bl: 'M70 86 Q80 79 93 77', br: 'M107 77 Q120 79 130 86', eyes: 'wide', o: true, blush: .95, sweat: true },
    sour: { bl: 'M70 80 Q82 82 93 89', br: 'M107 89 Q118 82 130 80', eyes: 'squeeze', pucker: true, blush: .45 },
    bitter: { bl: 'M70 83 Q82 86 93 91', br: 'M107 85 Q118 79 130 81', eyes: 'disgust', mouth: 'M86 131 Q93 124 100 128 Q107 132 114 126', tongue: true, blush: .2 },
    astringent: { bl: 'M71 86 L93 86', br: 'M107 86 L129 86', eyes: 'half', mouth: 'M87 128 Q93 125 100 128 Q107 131 113 128', blush: .15 }
  };

  var $ = function (id) { return document.getElementById(id); };
  var clamp01 = function (v) { return Math.min(1, Math.max(0, v)); };
  var eio = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  var state = { t: 0, menu: false, hov: null, react: null, sent: false };
  var navT = null, glideRaf = null, raf = null, lastExpr = null;

  /* ---------- Elements ---------- */
  var menuToggle = $('menuToggle'), siteMenu = $('siteMenu');
  var menuTiles = Array.prototype.slice.call(document.querySelectorAll('.menu-tile'));
  var hero = $('hero'), face = $('face'), faceSvg = $('faceSvg'), avatar = $('avatar');
  var bubble = $('bubble'), caption = $('caption'), centerTop = $('centerTop'), centerBottom = $('centerBottom');
  var dishes = Array.prototype.slice.call(document.querySelectorAll('.dish'));
  var plateWrap = $('plateWrap'), plate = $('plate');
  var ghost = $('ghost'), ghostA = $('ghostA'), ghostB = $('ghostB');
  var drinks = $('drinks'), pour = $('pour'), stage = $('stage'), pourHint = $('pourHint');
  var bottleWrap = $('bottleWrap'), bottle = $('bottle'), bottleLiquid = $('bottleLiquid');
  var bottleSurface = bottleLiquid.querySelector('.b-surface');
  var slots = Array.prototype.slice.call(document.querySelectorAll('.glass-slot'));
  var glasses = Array.prototype.slice.call(document.querySelectorAll('.glass'));
  var fills = slots.map(function (s) { return s.querySelector('.glass-fill'); });
  var panel = $('panel'), panels = Array.prototype.slice.call(document.querySelectorAll('.taste'));

  /* ---------- Face ---------- */
  function svgEl(tag, attrs, style) {
    var s = '<' + tag;
    for (var k in attrs) s += ' ' + k + '="' + attrs[k] + '"';
    if (style) s += ' style="' + style + '"';
    return s + '/>';
  }
  function renderFace(ex) {
    if (ex === lastExpr) return;
    lastExpr = ex;
    if (ex === 'neutral') { faceSvg.innerHTML = ''; return; }
    var E = EXPR[ex], skin = '#e89760', brow = '#2a1d18', ink = '#1f1512';
    var out = '';
    // Skin patches that cover the avatar's own features.
    [[520, 445, 60, 24], [718, 445, 60, 26], [515, 529, 50, 45], [724, 529, 50, 45], [619, 660, 68, 24]].forEach(function (p) {
      out += svgEl('ellipse', { cx: p[0], cy: p[1], rx: p[2], ry: p[3], fill: skin });
    });
    var g = '';
    var browStyle = 'stroke:' + brow + ';stroke-width:3.6;stroke-linecap:round';
    var ln = 'stroke:' + ink + ';stroke-width:2;stroke-linecap:round;stroke-linejoin:round';
    g += svgEl('path', { d: E.bl, fill: 'none' }, browStyle) + svgEl('path', { d: E.br, fill: 'none' }, browStyle);
    function open(cx, big) {
      var lash = cx < 100 ? 'M' + (cx - 5) + ' 96 Q' + (cx - 8) + ' 94 ' + (cx - 9.5) + ' 95' : 'M' + (cx + 5) + ' 96 Q' + (cx + 8) + ' 94 ' + (cx + 9.5) + ' 95';
      return '<g style="animation:blink 5s infinite;transform-origin:' + cx + 'px 100px">' +
        svgEl('ellipse', { cx: cx, cy: 100, rx: big ? 6.4 : 5.2, ry: big ? 7.8 : 6.4, fill: ink }) +
        svgEl('circle', { cx: cx + 1.4, cy: big ? 97 : 97.8, r: big ? 1.6 : 1.3, fill: '#fff' }) +
        svgEl('path', { d: lash, fill: 'none' }, 'stroke:' + ink + ';stroke-width:1.4;stroke-linecap:round') + '</g>';
    }
    function half(cx) {
      return '<g>' + svgEl('path', { d: 'M' + (cx - 6) + ' 99 Q' + cx + ' 106 ' + (cx + 6) + ' 99 Z', fill: ink }) +
        svgEl('path', { d: 'M' + (cx - 7) + ' 99 L' + (cx + 7) + ' 99', fill: 'none' }, ln) + '</g>';
    }
    function happy(cx) { return svgEl('path', { d: 'M' + (cx - 6) + ' 101 Q' + cx + ' 93 ' + (cx + 6) + ' 101', fill: 'none' }, ln); }
    var ey = E.eyes;
    if (ey === 'open') g += open(82) + open(118);
    if (ey === 'wide') g += open(82, true) + open(118, true);
    if (ey === 'happy') g += happy(82) + happy(118);
    if (ey === 'half') g += half(82) + half(118);
    if (ey === 'smirk') g += open(82) + half(118);
    if (ey === 'squeeze') g += svgEl('path', { d: 'M77 95 L87 100 L77 105', fill: 'none' }, ln) + svgEl('path', { d: 'M123 95 L113 100 L123 105', fill: 'none' }, ln);
    if (ey === 'disgust') g += svgEl('path', { d: 'M76 100 Q82 97 88 100', fill: 'none' }, ln) + open(118);
    if (E.blush > .3) {
      g += svgEl('ellipse', { cx: 76, cy: 115, rx: 8, ry: 5, fill: '#e8705f', opacity: E.blush - .25 });
      g += svgEl('ellipse', { cx: 124, cy: 115, rx: 8, ry: 5, fill: '#e8705f', opacity: E.blush - .25 });
    }
    if (E.mouth) g += E.fill ? svgEl('path', { d: E.mouth, fill: '#6b1f22' }) : svgEl('path', { d: E.mouth, fill: 'none' }, ln);
    if (E.o) g += svgEl('ellipse', { cx: 100, cy: 128, rx: 5.5, ry: 7, fill: '#6b1f22' });
    if (E.pucker) g += svgEl('ellipse', { cx: 100, cy: 127, rx: 3.6, ry: 4, fill: 'none' }, ln);
    if (E.tongue) g += svgEl('ellipse', { cx: 104, cy: 131, rx: 4.5, ry: 3.6, fill: '#e07a7a' });
    if (E.sweat) g += svgEl('path', { d: 'M138 72 Q145 84 138 89 Q131 84 138 72 Z', fill: '#9fd3f0' }, 'stroke:#fff;stroke-width:1');
    out += '<g transform="translate(620 530) scale(5.1) translate(-100 -100)"><g style="animation:facepop .35s ease-out;transform-origin:100px 110px">' + g + '</g></g>';
    faceSvg.innerHTML = out;
  }
  avatar.addEventListener('error', function () { face.classList.add('no-avatar'); });
  if (avatar.complete && avatar.naturalWidth === 0) face.classList.add('no-avatar');

  /* ---------- Hero (thali) ---------- */
  var lastBubble = null;
  function renderHero() {
    var fi = state.hov != null ? state.hov : state.react;
    renderFace(fi == null ? 'neutral' : TASTES[fi].key);

    var tasting = fi != null;
    hero.classList.toggle('is-tasting', tasting);
    face.classList.toggle('is-tasting', tasting);
    if (tasting) { hero.style.setProperty('--hue', TASTES[fi].hue); face.style.setProperty('--hue', TASTES[fi].hue); }

    var bkey = fi == null ? 'n' : String(fi);
    if (bkey !== lastBubble) {
      lastBubble = bkey;
      var span = document.createElement('span');
      span.className = 'bubble-line';
      span.textContent = fi == null ? 'Hungry? Pick something from my thali.' : DISHES[fi].line;
      bubble.replaceChildren(span);
    }
    caption.textContent = fi == null ? 'Tap a dish to open that side' : DISHES[fi].dish + ' · ' + TASTES[fi].name + ' → ' + TASTES[fi].holds;
    centerTop.textContent = fi == null ? 'Pick a dish' : DISHES[fi].dish;
    centerBottom.textContent = fi == null ? 'Six tastes' : TASTES[fi].name;
  }

  function bite(i) {
    clearTimeout(navT);
    state.react = i; state.hov = i;
    renderHero();
    navT = setTimeout(function () { go(i, true, true); }, 700);
  }

  dishes.forEach(function (d) {
    var i = +d.dataset.i;
    d.addEventListener('click', function (e) { e.stopPropagation(); bite(i); });
    d.addEventListener('mouseenter', function () { state.hov = i; renderHero(); });
    d.addEventListener('focus', function () { state.hov = i; renderHero(); });
    d.addEventListener('mouseleave', function () { state.hov = null; renderHero(); });
    d.addEventListener('blur', function () { state.hov = null; renderHero(); });
  });
  // Clicking the empty hero clears the reaction.
  hero.addEventListener('click', function () {
    clearTimeout(navT);
    state.react = null; state.hov = null;
    renderHero();
  });

  /* ---------- Menu ---------- */
  function setMenu(open) {
    state.menu = open;
    siteMenu.hidden = !open;
    menuToggle.setAttribute('aria-expanded', String(open));
  }
  menuToggle.addEventListener('click', function () { setMenu(!state.menu); });
  menuTiles.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.i, true, true); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.menu) { setMenu(false); menuToggle.focus(); } });

  /* ---------- Taste panel ---------- */
  function renderPanel() {
    var t = state.t, cur = TASTES[t];
    panel.style.setProperty('--hue', cur.hue);
    $('panelKicker').textContent = String(t + 1).padStart(2, '0') + ' · ' + cur.name;
    $('panelTitle').textContent = cur.holds;
    $('panelLine').textContent = cur.line;
    $('panelPersona').textContent = cur.persona;
    panels.forEach(function (p) { p.hidden = p.dataset.key !== cur.key; });
    $('prevName').textContent = TASTES[(t + 5) % 6].name;
    $('nextName').textContent = TASTES[(t + 1) % 6].name;
    menuTiles.forEach(function (b, i) { b.classList.toggle('is-current', i === t); });
    glasses.forEach(function (g, i) {
      g.classList.toggle('is-current', i === t);
      if (i === t) g.setAttribute('aria-current', 'true'); else g.removeAttribute('aria-current');
    });
    updatePour();
  }

  function glide(to, dur) {
    cancelAnimationFrame(glideRaf);
    var from = window.scrollY, t0 = performance.now();
    var ease = function (x) { return -(Math.cos(Math.PI * x) - 1) / 2; };
    var stop = function () {
      cancelAnimationFrame(glideRaf);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    var step = function (now) {
      var k = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, from + (to - from) * ease(k));
      if (k < 1) glideRaf = requestAnimationFrame(step); else stop();
    };
    glideRaf = requestAnimationFrame(step);
  }

  function go(i, scroll, force) {
    state.t = (i + 6) % 6;
    setMenu(false);
    renderPanel();
    if (!scroll) return;
    var r = panel.getBoundingClientRect();
    if (force || r.top > window.innerHeight - 160 || r.top < 80) {
      var target = window.scrollY + r.top - 84;
      var pr = pour.getBoundingClientRect();
      var pourEnd = window.scrollY + pr.bottom - window.innerHeight;
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // From above the pour, glide slowly so the plate→bottle→glasses story plays out.
      if (!reduced && target > window.scrollY && window.scrollY < pourEnd - 10) glide(target, 3200);
      else window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  glasses.forEach(function (g) { g.addEventListener('click', function () { go(+g.dataset.i, true); }); });
  $('prevBtn').addEventListener('click', function () { go(state.t - 1, true); });
  $('nextBtn').addEventListener('click', function () { go(state.t + 1, true); });

  $('scrollCue').addEventListener('click', function (e) {
    e.stopPropagation();
    window.scrollTo({ top: window.scrollY + drinks.getBoundingClientRect().top - 64, behavior: 'smooth' });
  });

  /* ---------- Scroll: plate → bottle → poured glasses ---------- */
  function morph() {
    var end = window.scrollY + pour.getBoundingClientRect().top - 64;
    var m = clamp01((window.scrollY - end * 0.1) / Math.max(1, end * 0.9));
    if (m <= 0 || m >= 1) {
      ghost.style.display = 'none';
      plateWrap.style.opacity = '1';
      bottleWrap.style.opacity = m >= 1 ? '1' : '0';
      return;
    }
    plateWrap.style.opacity = '0'; bottleWrap.style.opacity = '0'; ghost.style.display = 'block';
    var e = eio(m);
    var A = plate.getBoundingClientRect(), B = bottle.getBoundingClientRect();
    var lerp = function (x, y) { return x + (y - x) * e; };
    var L = lerp(A.left, B.left), T = lerp(A.top, B.top), W = lerp(A.width, B.width), H = lerp(A.height, B.height);
    ghost.style.left = L + 'px'; ghost.style.top = T + 'px'; ghost.style.width = W + 'px'; ghost.style.height = H + 'px';
    var d = Math.min(W, H) * (1 - 0.15 * e);
    var k = function (v, a, b) { return clamp01((v - a) / (b - a)); };
    ghostA.style.width = d + 'px'; ghostA.style.height = d + 'px';
    ghostA.style.transform = 'translate(-50%,-50%) rotate(' + (e * 300) + 'deg)';
    ghostA.style.opacity = String(1 - k(m, 0.55, 0.85));
    ghostB.style.opacity = String(k(m, 0.5, 0.85));
  }

  function updatePour() {
    var r = pour.getBoundingClientRect();
    var total = Math.max(1, r.height - (window.innerHeight - 64));
    var P = clamp01((64 - r.top) / total);
    var seg = function (a, b) { return clamp01((P - a) / (b - a)); };
    var spread = eio(seg(0.15, 0.45)), fill = eio(seg(0.42, 0.78)), fade = seg(0.76, 0.94);
    var spacing = Math.min(140, ((stage.clientWidth || 800) - 16) / 6);

    pourHint.textContent = spread < 0.9 ? 'Keep scrolling to pour.' : 'Pick a glass to open that side of me.';

    var clip = (fill * 100).toFixed(1) + '%';
    bottleLiquid.style.clipPath = 'inset(' + clip + ' 0 0 0)';
    bottleSurface.style.top = clip;
    bottle.style.opacity = (1 - fade).toFixed(3);
    bottle.style.transform = 'translateX(-50%) translateY(' + (-30 * fade).toFixed(1) + 'px) scale(' + (1 - 0.15 * fade).toFixed(3) + ') rotate(' + (-7 * Math.sin(fill * Math.PI)).toFixed(2) + 'deg)';

    stage.classList.toggle('is-narrow', spacing < 100);
    var scale = (0.45 + 0.55 * spread).toFixed(3), op = Math.min(1, spread * 3).toFixed(3), pe = spread > 0.95 ? 'auto' : 'none';
    slots.forEach(function (s, i) {
      var x = ((i - 2.5) * spacing * spread).toFixed(1);
      s.style.transform = 'translateX(calc(-50% + ' + x + 'px)) scale(' + scale + ')';
      s.style.opacity = op;
      s.style.pointerEvents = pe;
      fills[i].style.height = (fill * (i === state.t ? 80 : 56)).toFixed(1) + '%';
    });
  }

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = null;
      morph();
      updatePour();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Contact ---------- */
  var contact = $('contact');
  if ('IntersectionObserver' in window) {
    contact.classList.add('reveal-pending');
    requestAnimationFrame(function () { contact.classList.add('reveal-ready'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        contact.classList.remove('reveal-pending');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    io.observe(contact);
  }

  // Messages are posted to Formspree in the background, so the visitor never leaves the page.
  var CONTACT_EMAIL = 'thejovati256@gmail.com';
  var FORMSPREE_URL = 'https://formspree.io/f/mgaorqgv';
  var sentNote = $('sentNote');
  var sendBtn = $('contactForm').querySelector('.send-btn');
  var sending = false;

  $('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    if (sending) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var f = new FormData(form);
    var val = function (k) { return String(f.get(k) || '').trim(); };
    var name = [val('first'), val('last')].filter(Boolean).join(' ');
    var email = val('email');
    var payload = {
      name: name || 'Not given',
      email: email,
      message: val('message') || '(No message)',
      _replyto: email,
      _subject: 'Hello from ' + (name || 'your portfolio')
    };

    sending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    sentNote.textContent = '';

    fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var msg = data.errors && data.errors.length
              ? data.errors.map(function (er) { return er.message; }).join(' ')
              : 'The server returned an error (' + res.status + ').';
            throw new Error(msg);
          }
        });
      })
      .then(function () {
        form.reset();
        sentNote.textContent = 'Thank you! Your message has been sent successfully.';
      })
      .catch(function (err) {
        var detail = err && err.message && err.message !== 'Failed to fetch' ? ' ' + err.message : ' Please check your connection.';
        sentNote.textContent = 'Sorry, your message could not be sent.' + detail +
          ' Please try again, or email me directly at ' + CONTACT_EMAIL + '.';
      })
      .then(function () {
        sending = false;
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
      });
  });

  /* ---------- Init ---------- */
  renderHero();
  renderPanel();
  morph();
})();
