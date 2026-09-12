// VYRA — interactions du site : menu mobile + fond animé du hero.
(function () {
  // Menu mobile
  var nav = document.getElementById('nav'), burger = document.getElementById('burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open'); burger.textContent = o ? '×' : '≡';
    });
    nav.querySelectorAll('.links a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); burger.textContent = '≡'; });
    });
  }

  // Achat via FedaPay. Collez ici vos liens de paiement FedaPay (un par édition), créés dans votre
  // tableau de bord FedaPay. Tant qu'un lien est vide, le bouton bascule sur WhatsApp : l'acheteur
  // envoie son « code du poste » pour recevoir sa licence (la licence est liée à un poste précis).
  var FEDAPAY = { solo: '', duo: '', pro: '' };
  var WA = '2290141595929';
  document.querySelectorAll('[data-buy]').forEach(function (a) {
    var ed = a.getAttribute('data-buy');
    var link = FEDAPAY[ed];
    if (link) {
      a.href = link;
    } else {
      a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(
        'Bonjour, je souhaite acheter VYRA ' + ed.toUpperCase() +
        ' (paiement FedaPay). Voici mon code du poste : ');
    }
    a.target = '_blank'; a.rel = 'noopener';
  });

  // Téléchargement direct : au chargement, on pointe les boutons du hero sur le FICHIER réel de la
  // dernière Release GitHub (l'asset .exe / .apk), pour que le clic lance le téléchargement tout de
  // suite. GitHub sert ces liens avec Content-Disposition: attachment → le fichier se télécharge sans
  // quitter la page. Repli conservé (href = page des Releases) si l'API échoue.
  (function () {
    var REPO = 'AnzaiMuki/universal-ndi-camera';
    var win = document.getElementById('dl-win'), and = document.getElementById('dl-android');
    if (!win && !and) return;
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (rel) {
        var assets = rel.assets || [];
        function url(ext) {
          for (var i = 0; i < assets.length; i++) {
            if ((assets[i].name || '').toLowerCase().slice(-ext.length) === ext) return assets[i].browser_download_url;
          }
          return null;
        }
        var exe = url('.exe'), apk = url('.apk'), ver = (rel.tag_name || '').replace(/^v/i, '');
        function wire(el, link, ext) {
          if (!el || !link) return;
          el.href = link; el.removeAttribute('target');
          var v = el.querySelector('.v'); if (v) v.textContent = ext + (ver ? ' · v' + ver : '');
        }
        wire(win, exe, '.exe');
        wire(and, apk, '.apk');
      })
      .catch(function () { /* on garde le repli : la page des Releases */ });
  })();

  // Fond animé du hero : NAPPE DE PARTICULES qui ondule en continu (grille de points en perspective,
  // crête lumineuse blanche sur champ bleu), rendu additif. Bridé à ~30 i/s ; figé si l'utilisateur
  // a demandé de réduire les animations.
  var cv = document.getElementById('heroBg');
  if (!cv) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(1.75, window.devicePixelRatio || 1);
    var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = Math.max(1, Math.round(W * dpr)); cv.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); window.addEventListener('resize', size);

  function makeDot(r, g, b) {
    var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d');
    var grd = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',1)');
    grd.addColorStop(.35, 'rgba(' + r + ',' + g + ',' + b + ',.5)');
    grd.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = grd; x.fillRect(0, 0, 32, 32); return c;
  }
  var dotBlue = makeDot(80, 150, 255), dotWhite = makeDot(255, 255, 255);
  function grid() { return W < 700 ? { C: 54, R: 30 } : { C: 90, R: 42 }; }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#05070A'; ctx.fillRect(0, 0, W, H);
    var g = grid(), C = g.C, R = g.R, T = t * 0.00035;
    ctx.globalCompositeOperation = 'lighter';
    for (var j = 0; j < R; j++) {
      var depth = j / (R - 1);
      var persp = 0.30 + depth * 0.95;
      var y0 = H * 0.34 + Math.pow(depth, 1.7) * H * 0.72;
      var dfade = 0.22 + 0.78 * depth;
      for (var i = 0; i < C; i++) {
        var cx = i - (C - 1) / 2;
        var w = Math.sin(cx * 0.16 - depth * 3.0 - T * 2.0) * 0.60
              + Math.sin(cx * 0.07 + depth * 2.0 + T * 1.3) * 0.50
              + Math.sin(depth * 5.0 - T * 1.7) * 0.35;
        var nb = Math.min(1, Math.max(0, (w + 1.2) / 2.6));
        var x = W / 2 + cx * (W / C) * 1.25 * persp;
        var y = y0 - w * 20 * persp;
        var s = (1.1 + persp * 3.0) * (0.55 + nb * 0.9);
        var blueA = (0.07 + 0.30 * nb) * dfade;
        var whiteA = Math.pow(nb, 2.4) * 0.85 * dfade;
        if (blueA > 0.015) { ctx.globalAlpha = blueA; ctx.drawImage(dotBlue, x - s / 2, y - s / 2, s, s); }
        if (whiteA > 0.02) { var ws = s * 0.7; ctx.globalAlpha = whiteA; ctx.drawImage(dotWhite, x - ws / 2, y - ws / 2, ws, ws); }
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) { draw(1600); return; }
  var last = 0;
  function loop(t) { if (t - last > 33) { last = t; draw(t); } requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
})();
