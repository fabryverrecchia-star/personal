/* 18H22 : la suite du site, sous la montre.
   Textes fr/en/es/it, apparitions au défilement, tunnel du temps (three.js),
   cadran de la méthode, bouton de contact flottant. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var PROJECTS = window.PROJECTS || [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ------------------------------------------------------------------------
     Textes
     ------------------------------------------------------------------------ */
  var COPY = {
    fr: {
      cue: 'Entrer',
      reelLabel: 'Showreel', reelLine: 'Paris, 18h22.', soundOn: 'Son', soundOff: 'Couper le son',
      introLabel: 'Studio',
      introTitle: 'Direction artistique, image et présence digitale pour les maisons et les marques d’exception.',
      introText: 'Depuis Paris, 18H22 conçoit des identités, les photographie et les fait vivre dans le temps. Hôtellerie, gastronomie, mode, musique, artisanat.',
      ctaTalk: 'Prendre contact', ctaWork: 'Projets', ctaMeet: 'Prendre contact', ctaFloat: 'Contact',
      offerLabel: 'Expertises', offerTitle: '',
      offer: [
        { t: 'Identité', d: 'Création et refonte d’identités : signe, typographie, papeterie, objets.' },
        { t: 'Image', d: 'Photographie et film. Une lumière, un cadrage, une écriture propres à chaque maison.' },
        { t: 'Présence digitale', d: 'Ligne éditoriale, calendrier mensuel, publication et campagnes ciblées.' },
        { t: 'Lancements', d: 'Ouverture, collection, nouvelle saison : la mise en scène d’un moment.' }
      ],
      workLabel: 'Projets', workTitle: 'Sélection', workHint: 'Défiler', workAll: 'Index',
      spaceLabel: 'Espace client', spaceTitle: 'Un espace privé pour chaque maison.',
      spaceText: 'Calendrier éditorial, visuels à valider, dates de prise de vue, travaux en cours : réunis sur une page confidentielle, accessible depuis votre téléphone.',
      spaceList: ['Calendrier éditorial', 'Validation des contenus', 'Dates de prise de vue', 'Suivi des campagnes'],
      phoneMonth: 'Novembre', phoneRow1: 'Mar. 14 · Prise de vue', phoneRow2: 'Film de lancement · validé',
      methodLabel: 'Méthode', methodTitle: 'De 9h00 à 18h22.',
      steps: [
        { h: 9, m: 0, t: 'Rencontre', d: 'Nous commençons sur place, au contact de la maison et de ceux qui la font.' },
        { h: 11, m: 30, t: 'Direction', d: 'Une direction artistique écrite et validée avant toute production.' },
        { h: 15, m: 0, t: 'Production', d: 'Prises de vue, création, rédaction. Chaque élément vous est soumis.' },
        { h: 18, m: 22, t: 'Diffusion', d: 'Publication, campagnes et lecture des résultats, chaque mois.' }
      ],
      plansLabel: 'Collaborations', plansTitle: '',
      plans: [
        { k: 'monthly', t: 'Accompagnement', d: 'Une présence suivie, mois après mois.', i: ['Direction éditoriale', 'Prises de vue régulières', 'Publication', 'Campagnes ciblées', 'Espace client'], c: 'Demander une proposition' },
        { k: 'identity', t: 'Identité', d: 'Création ou refonte.', i: ['Signe et système graphique', 'Direction artistique', 'Édition et objets', 'Prise de vue de lancement'], c: 'Demander une proposition' },
        { k: 'shoot', t: 'Prise de vue', d: 'Photographie et film, à la journée.', i: ['Direction de la prise de vue', 'Retouche', 'Déclinaisons par support'], c: 'Réserver une date' }
      ],
      quote: 'Sur proposition',
      clientsLabel: 'Clients',
      endTitle: 'Écrivez-nous.',
      endText: 'Quelques lignes sur votre maison et votre projet suffisent. Nous revenons vers vous avec une proposition.',
      navOffer: 'Expertises', navWork: 'Projets', navMethod: 'Méthode', navContact: 'Contact',
      need: 'Objet', needMonthly: 'Accompagnement', needIdentity: 'Identité', needShoot: 'Prise de vue', needOther: 'Autre'
    },
    en: {
      cue: 'Enter',
      reelLabel: 'Showreel', reelLine: 'Paris, 18:22.', soundOn: 'Sound', soundOff: 'Mute',
      introLabel: 'Studio',
      introTitle: 'Art direction, image and digital presence for houses and brands of distinction.',
      introText: 'From Paris, 18H22 designs identities, photographs them and keeps them alive over time. Hospitality, gastronomy, fashion, music, craftsmanship.',
      ctaTalk: 'Get in touch', ctaWork: 'Work', ctaMeet: 'Get in touch', ctaFloat: 'Contact',
      offerLabel: 'Expertise', offerTitle: '',
      offer: [
        { t: 'Identity', d: 'Identity creation and redesign: mark, typography, stationery, objects.' },
        { t: 'Image', d: 'Photography and film. A light, a framing, a language specific to each house.' },
        { t: 'Digital presence', d: 'Editorial line, monthly calendar, publishing and targeted campaigns.' },
        { t: 'Launches', d: 'An opening, a collection, a new season: staging a moment.' }
      ],
      workLabel: 'Work', workTitle: 'Selection', workHint: 'Scroll', workAll: 'Index',
      spaceLabel: 'Client space', spaceTitle: 'A private space for every house.',
      spaceText: 'Editorial calendar, visuals to approve, shooting dates, work in progress: gathered on a confidential page, available from your phone.',
      spaceList: ['Editorial calendar', 'Content approval', 'Shooting dates', 'Campaign tracking'],
      phoneMonth: 'November', phoneRow1: 'Tue 14 · Shoot', phoneRow2: 'Launch film · approved',
      methodLabel: 'Method', methodTitle: 'From 9:00 to 18:22.',
      steps: [
        { h: 9, m: 0, t: 'Encounter', d: 'We begin on site, close to the house and the people who make it.' },
        { h: 11, m: 30, t: 'Direction', d: 'A written art direction, approved before any production.' },
        { h: 15, m: 0, t: 'Production', d: 'Shoots, design, writing. Every piece is submitted to you.' },
        { h: 18, m: 22, t: 'Release', d: 'Publishing, campaigns and a reading of the results, every month.' }
      ],
      plansLabel: 'Engagements', plansTitle: '',
      plans: [
        { k: 'monthly', t: 'Partnership', d: 'A sustained presence, month after month.', i: ['Editorial direction', 'Regular shoots', 'Publishing', 'Targeted campaigns', 'Client space'], c: 'Request a proposal' },
        { k: 'identity', t: 'Identity', d: 'Creation or redesign.', i: ['Mark and graphic system', 'Art direction', 'Print and objects', 'Launch shoot'], c: 'Request a proposal' },
        { k: 'shoot', t: 'Shoot', d: 'Photography and film, by the day.', i: ['Shoot direction', 'Retouching', 'Formats for every medium'], c: 'Book a date' }
      ],
      quote: 'On proposal',
      clientsLabel: 'Clients',
      endTitle: 'Write to us.',
      endText: 'A few lines about your house and your project are enough. We will come back to you with a proposal.',
      navOffer: 'Expertise', navWork: 'Work', navMethod: 'Method', navContact: 'Contact',
      need: 'Subject', needMonthly: 'Partnership', needIdentity: 'Identity', needShoot: 'Shoot', needOther: 'Other'
    },
    es: {
      cue: 'Entrar',
      reelLabel: 'Showreel', reelLine: 'París, 18:22.', soundOn: 'Sonido', soundOff: 'Silenciar',
      introLabel: 'Estudio',
      introTitle: 'Dirección de arte, imagen y presencia digital para casas y marcas de excepción.',
      introText: 'Desde París, 18H22 diseña identidades, las fotografía y las hace vivir en el tiempo. Hotelería, gastronomía, moda, música, artesanía.',
      ctaTalk: 'Contactar', ctaWork: 'Proyectos', ctaMeet: 'Contactar', ctaFloat: 'Contacto',
      offerLabel: 'Especialidades', offerTitle: '',
      offer: [
        { t: 'Identidad', d: 'Creación y rediseño de identidades: signo, tipografía, papelería, objetos.' },
        { t: 'Imagen', d: 'Fotografía y cine. Una luz, un encuadre, una escritura propios de cada casa.' },
        { t: 'Presencia digital', d: 'Línea editorial, calendario mensual, publicación y campañas segmentadas.' },
        { t: 'Lanzamientos', d: 'Una apertura, una colección, una nueva temporada: la puesta en escena de un momento.' }
      ],
      workLabel: 'Proyectos', workTitle: 'Selección', workHint: 'Desplazar', workAll: 'Índice',
      spaceLabel: 'Espacio cliente', spaceTitle: 'Un espacio privado para cada casa.',
      spaceText: 'Calendario editorial, visuales por validar, fechas de rodaje, trabajos en curso: reunidos en una página confidencial, accesible desde tu teléfono.',
      spaceList: ['Calendario editorial', 'Validación de contenidos', 'Fechas de rodaje', 'Seguimiento de campañas'],
      phoneMonth: 'Noviembre', phoneRow1: 'Mar. 14 · Rodaje', phoneRow2: 'Película de lanzamiento · validada',
      methodLabel: 'Método', methodTitle: 'De 9:00 a 18:22.',
      steps: [
        { h: 9, m: 0, t: 'Encuentro', d: 'Empezamos en el lugar, cerca de la casa y de quienes la hacen.' },
        { h: 11, m: 30, t: 'Dirección', d: 'Una dirección de arte escrita y validada antes de cualquier producción.' },
        { h: 15, m: 0, t: 'Producción', d: 'Rodajes, diseño, redacción. Cada pieza se te presenta.' },
        { h: 18, m: 22, t: 'Difusión', d: 'Publicación, campañas y lectura de resultados, cada mes.' }
      ],
      plansLabel: 'Colaboraciones', plansTitle: '',
      plans: [
        { k: 'monthly', t: 'Acompañamiento', d: 'Una presencia constante, mes a mes.', i: ['Dirección editorial', 'Rodajes regulares', 'Publicación', 'Campañas segmentadas', 'Espacio cliente'], c: 'Pedir una propuesta' },
        { k: 'identity', t: 'Identidad', d: 'Creación o rediseño.', i: ['Signo y sistema gráfico', 'Dirección de arte', 'Edición y objetos', 'Rodaje de lanzamiento'], c: 'Pedir una propuesta' },
        { k: 'shoot', t: 'Rodaje', d: 'Fotografía y cine, por jornada.', i: ['Dirección del rodaje', 'Retoque', 'Formatos para cada soporte'], c: 'Reservar fecha' }
      ],
      quote: 'Según propuesta',
      clientsLabel: 'Clientes',
      endTitle: 'Escríbenos.',
      endText: 'Unas líneas sobre tu casa y tu proyecto bastan. Volveremos a ti con una propuesta.',
      navOffer: 'Especialidades', navWork: 'Proyectos', navMethod: 'Método', navContact: 'Contacto',
      need: 'Asunto', needMonthly: 'Acompañamiento', needIdentity: 'Identidad', needShoot: 'Rodaje', needOther: 'Otro'
    },
    it: {
      cue: 'Entra',
      reelLabel: 'Showreel', reelLine: 'Parigi, 18:22.', soundOn: 'Audio', soundOff: 'Muto',
      introLabel: 'Studio',
      introTitle: 'Direzione artistica, immagine e presenza digitale per maison e marchi d’eccezione.',
      introText: 'Da Parigi, 18H22 disegna identità, le fotografa e le fa vivere nel tempo. Ospitalità, gastronomia, moda, musica, artigianato.',
      ctaTalk: 'Contattaci', ctaWork: 'Progetti', ctaMeet: 'Contattaci', ctaFloat: 'Contatti',
      offerLabel: 'Competenze', offerTitle: '',
      offer: [
        { t: 'Identità', d: 'Creazione e restyling di identità: segno, tipografia, cancelleria, oggetti.' },
        { t: 'Immagine', d: 'Fotografia e film. Una luce, un’inquadratura, una scrittura proprie di ogni maison.' },
        { t: 'Presenza digitale', d: 'Linea editoriale, calendario mensile, pubblicazione e campagne mirate.' },
        { t: 'Lanci', d: 'Un’apertura, una collezione, una nuova stagione: la messa in scena di un momento.' }
      ],
      workLabel: 'Progetti', workTitle: 'Selezione', workHint: 'Scorri', workAll: 'Indice',
      spaceLabel: 'Area cliente', spaceTitle: 'Uno spazio privato per ogni maison.',
      spaceText: 'Calendario editoriale, visual da approvare, date di shooting, lavori in corso: riuniti in una pagina riservata, accessibile dal telefono.',
      spaceList: ['Calendario editoriale', 'Approvazione dei contenuti', 'Date di shooting', 'Monitoraggio delle campagne'],
      phoneMonth: 'Novembre', phoneRow1: 'Mar 14 · Shooting', phoneRow2: 'Film di lancio · approvato',
      methodLabel: 'Metodo', methodTitle: 'Dalle 9:00 alle 18:22.',
      steps: [
        { h: 9, m: 0, t: 'Incontro', d: 'Iniziamo sul posto, a contatto con la maison e con chi la fa vivere.' },
        { h: 11, m: 30, t: 'Direzione', d: 'Una direzione artistica scritta e approvata prima di ogni produzione.' },
        { h: 15, m: 0, t: 'Produzione', d: 'Shooting, design, scrittura. Ogni elemento vi viene sottoposto.' },
        { h: 18, m: 22, t: 'Diffusione', d: 'Pubblicazione, campagne e lettura dei risultati, ogni mese.' }
      ],
      plansLabel: 'Collaborazioni', plansTitle: '',
      plans: [
        { k: 'monthly', t: 'Accompagnamento', d: 'Una presenza costante, mese dopo mese.', i: ['Direzione editoriale', 'Shooting regolari', 'Pubblicazione', 'Campagne mirate', 'Area cliente'], c: 'Richiedi una proposta' },
        { k: 'identity', t: 'Identità', d: 'Creazione o restyling.', i: ['Segno e sistema grafico', 'Direzione artistica', 'Editoria e oggetti', 'Shooting di lancio'], c: 'Richiedi una proposta' },
        { k: 'shoot', t: 'Shooting', d: 'Fotografia e film, a giornata.', i: ['Direzione dello shooting', 'Ritocco', 'Formati per ogni supporto'], c: 'Prenota una data' }
      ],
      quote: 'Su proposta',
      clientsLabel: 'Clienti',
      endTitle: 'Scriveteci.',
      endText: 'Bastano poche righe sulla vostra maison e sul vostro progetto. Torneremo da voi con una proposta.',
      navOffer: 'Competenze', navWork: 'Progetti', navMethod: 'Metodo', navContact: 'Contatti',
      need: 'Oggetto', needMonthly: 'Accompagnamento', needIdentity: 'Identità', needShoot: 'Shooting', needOther: 'Altro'
    }
  };

  var CLIENTS = ['La Petite Maison', 'Enza Famiglia', 'Jacqueline', 'Agata', 'Sounds Like Paris', 'Helicave'];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Mots masqués, qui montent un à un */
  function splitWords(el, text) {
    el.innerHTML = text.split(' ').map(function (w) {
      return '<span class="w"><span>' + esc(w) + '</span></span>';
    }).join(' ');
  }

  var current = null;
  function render(l) {
    var c = COPY[l] || COPY.fr;
    current = l;
    $$('[data-s]').forEach(function (el) {
      var v = c[el.dataset.s];
      if (v == null) return;
      el.hidden = v === '';
      if (el.classList.contains('rv-lines')) {
        splitWords(el, v);
        if (el.classList.contains('is-in')) $$('.w > span', el).forEach(function (s) { s.style.transform = 'none'; });
      } else el.textContent = v;
    });
    $$('#contact [data-i18n]').forEach(function (el) {
      var v = c[el.dataset.i18n];
      if (v != null) el.textContent = v;
    });

    $('#offerList').innerHTML = c.offer.map(function (o, i) {
      return '<li class="offer__row rv" data-peek="' + (i * 5 + 2) % Math.max(1, PROJECTS.length) + '">' +
        '<h3 class="offer__t">' + esc(o.t) + '</h3>' +
        '<div class="offer__body"><p>' + esc(o.d) + '</p>' +
        (o.i ? '<ul>' + o.i.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div></li>';
    }).join('');

    $('#spaceList').innerHTML = c.spaceList.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');

    $('#steps').innerHTML = c.steps.map(function (s, i) {
      return '<li class="step rv" data-i="' + i + '"><p class="step__time">' + pad(s.h) + ':' + pad(s.m) + '</p>' +
        '<h3 class="step__t">' + esc(s.t) + '</h3><p class="step__d">' + esc(s.d) + '</p></li>';
    }).join('');

    $('#plans').innerHTML = c.plans.map(function (p) {
      return '<article class="plan rv"><h3 class="plan__t">' + esc(p.t) + '</h3><p class="plan__d">' + esc(p.d) + '</p>' +
        '<ul>' + p.i.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<p class="plan__price">' + esc(c.quote) + '</p>' +
        '<button class="btn btn--solid" type="button" data-contact="' + p.k + '">' + esc(p.c) + '</button></article>';
    }).join('');

    $('#clients').innerHTML = CLIENTS.map(function (n) { return '<li class="rv">' + esc(n) + '</li>'; }).join('');

    observeAll();
  }

  /* ------------------------------------------------------------------------
     Apparitions au défilement
     ------------------------------------------------------------------------ */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      el.classList.add('is-in');
      if (reduce || !window.gsap) { el.style.opacity = 1; return; }
      if (el.classList.contains('rv-lines')) {
        gsap.to($$('.w > span', el), { y: '0%', duration: 1.3, ease: 'expo.out', stagger: 0.035 });
      } else {
        gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: (+el.dataset.delay || 0) });
      }
    });
  }, { rootMargin: '0px 0px -12% 0px' }) : null;

  function observeAll() {
    $$('.rv, .rv-lines').forEach(function (el, i) {
      if (el.classList.contains('is-in')) return;
      if (!io || reduce) { el.classList.add('is-in'); el.style.opacity = 1; $$('.w > span', el).forEach(function (s) { s.style.transform = 'none'; }); return; }
      io.observe(el);
    });
    // petit décalage entre voisins d'une même grille
    $$('.plans, .clients, .offer, .steps').forEach(function (g) {
      $$('.rv', g).forEach(function (el, i) { el.dataset.delay = (i % 4) * 0.08; });
    });
  }

  /* ------------------------------------------------------------------------
     Contact, index, défilement
     ------------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-contact]');
    if (b && window.APP) { e.preventDefault(); window.APP.openContact(b.dataset.contact || ''); return; }
    var a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === '#top') {
      e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    } else if (a && a.getAttribute('href').length > 1) {
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - (a.id === 'cue' ? 0 : 20), behavior: reduce ? 'auto' : 'smooth' }); }
    }
  });
  $('#workAll').addEventListener('click', function () { if (window.APP) window.APP.openGallery(); });

  /* La montre recule pendant que le site glisse par-dessus */
  var hero = $('#hero'), top = $('#top'), floatCta = $('#floatCta'), end = $('#fin');
  var H = window.innerHeight;
  window.addEventListener('resize', function () { H = window.innerHeight; });
  function onScroll() {
    var y = window.scrollY;
    var p = Math.min(1, y / H);
    hero.style.opacity = (1 - p * 0.85).toFixed(3);
    hero.style.transform = p > 0 ? 'scale(' + (1 - p * 0.08).toFixed(4) + ')' : '';
    hero.style.visibility = p >= 1 ? 'hidden' : '';
    top.classList.toggle('is-solid', y > H * 0.92);
    var endTop = end.getBoundingClientRect().top;
    floatCta.classList.toggle('is-on', y > H * 1.1 && endTop > H * 0.75 && !document.body.classList.contains('is-locked'));
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------------
     Offre : un projet suit le curseur au survol d'une ligne
     ------------------------------------------------------------------------ */
  var peek = document.createElement('img');
  peek.className = 'offer__peek';
  peek.alt = '';
  document.body.appendChild(peek);
  var pk = { x: 0, y: 0, tx: 0, ty: 0, on: false };
  if (fine && PROJECTS.length) {
    $('#offerList').addEventListener('pointerover', function (e) {
      var row = e.target.closest('.offer__row');
      if (!row) return;
      var p = PROJECTS[+row.dataset.peek];
      if (p && peek.getAttribute('src') !== p.src) peek.src = p.src;
      pk.on = true;
      peek.classList.add('is-on');
    });
    $('#offerList').addEventListener('pointerleave', function () { pk.on = false; peek.classList.remove('is-on'); });
    window.addEventListener('pointermove', function (e) { pk.tx = e.clientX; pk.ty = e.clientY; }, { passive: true });
    (function loop() {
      pk.x += (pk.tx - pk.x) * 0.12; pk.y += (pk.ty - pk.y) * 0.12;
      var r = (pk.tx - pk.x) * 0.05;
      if (pk.on) peek.style.transform = 'translate3d(' + pk.x.toFixed(1) + 'px,' + pk.y.toFixed(1) + 'px,0) translate(-50%,-50%) rotate(' + r.toFixed(2) + 'deg)';
      requestAnimationFrame(loop);
    })();
  }

  /* ------------------------------------------------------------------------
     Téléphone : un mois de posts
     ------------------------------------------------------------------------ */
  $('#phoneGrid').innerHTML = PROJECTS.slice(0, 9).map(function (p) {
    return '<span><img src="' + p.src + '" alt="" loading="lazy" decoding="async"></span>';
  }).join('');

  /* ------------------------------------------------------------------------
     Méthode : le cadran avance avec la journée
     ------------------------------------------------------------------------ */
  var mcTicks = $('#mcTicks');
  for (var k = 0; k < 60; k++) {
    var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x1', 0); ln.setAttribute('x2', 0);
    ln.setAttribute('y1', -100); ln.setAttribute('y2', k % 5 ? -96.5 : -92);
    ln.setAttribute('transform', 'rotate(' + k * 6 + ')');
    if (!(k % 5)) ln.setAttribute('class', 'is-hour');
    mcTicks.appendChild(ln);
  }
  var mc = { m: 9 * 60 };
  function paintMethod() {
    var m = mc.m;
    $('#mcHour').setAttribute('transform', 'rotate(' + (m * 0.5).toFixed(2) + ')');
    $('#mcMin').setAttribute('transform', 'rotate(' + (m * 6).toFixed(2) + ')');
    var mm = Math.round(m);
    $('#mcTime').textContent = pad(Math.floor(mm / 60) % 24) + ':' + pad(mm % 60);
  }
  paintMethod();
  var stepIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var s = COPY[current].steps[+e.target.dataset.i];
      $$('.step').forEach(function (el) { el.classList.toggle('is-now', el === e.target); });
      var target = s.h * 60 + s.m;
      if (window.gsap && !reduce) gsap.to(mc, { m: target, duration: 1.6, ease: 'expo.inOut', onUpdate: paintMethod, overwrite: true });
      else { mc.m = target; paintMethod(); }
    });
  }, { rootMargin: '-45% 0px -45% 0px' }) : null;
  function watchSteps() { if (stepIO) $$('.step').forEach(function (el) { stepIO.observe(el); }); }

  /* ------------------------------------------------------------------------
     Tunnel du temps (three.js) : on avance dans l'axe, les projets défilent
     en spirale, un cadran à chaque étape, les aiguilles avancent vers 18h22
     ------------------------------------------------------------------------ */
  function tunnel() {
    var section = $('#selection');
    var canvas = $('#tunnelGl');
    var now = $('#tunnelNow');
    var ok = false;
    try {
      ok = !!window.THREE && !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (e) { ok = false; }
    if (!ok || !PROJECTS.length) {
      document.documentElement.classList.add('no-tunnel');
      $('#tunnelFallback').innerHTML = PROJECTS.map(function (p) {
        return '<figure><img src="' + p.src + '" alt="" loading="lazy"><figcaption>' + esc(p.title || '') + '</figcaption></figure>';
      }).join('');
      return;
    }
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setClearColor(0x1c2333, 1);
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(55, 1, 0.05, 120);
    var mobile = false;
    var GAP = 5.2;
    var N = PROJECTS.length;
    var LEN = (N + 1) * GAP;

    var vert = [
      'uniform float uVel;',
      'uniform float uTime;',
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  vec3 p = position;',
      '  float bend = sin(uv.x * 3.14159) * sin(uv.y * 3.14159);',
      '  p.z += bend * uVel * 1.1;',
      '  p.x += sin(uv.y * 6.0 + uTime) * uVel * 0.12;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
      '}'
    ].join('\n');
    var frag = [
      'uniform sampler2D uTex;',
      'uniform float uVel;',
      'uniform float uAlpha;',
      'uniform float uReady;',
      'varying vec2 vUv;',
      'void main() {',
      '  vec2 uv = vUv;',
      '  float s = clamp(abs(uVel), 0.0, 1.0) * 0.012;',
      '  vec4 c = texture2D(uTex, uv);',
      '  float r = texture2D(uTex, uv + vec2(s, 0.0)).r;',
      '  float b = texture2D(uTex, uv - vec2(s, 0.0)).b;',
      '  vec3 col = vec3(r, c.g, b);',
      '  vec3 bg = vec3(0.110, 0.137, 0.200);',
      '  col = mix(bg, col, uReady);',
      '  gl_FragColor = vec4(col, uAlpha);',
      '}'
    ].join('\n');

    var loader = new T.TextureLoader();
    var geo = new T.PlaneGeometry(1, 1, 24, 24);
    var planes = PROJECTS.map(function (p, i) {
      var mat = new T.ShaderMaterial({
        vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false,
        uniforms: { uTex: { value: null }, uVel: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 0 }, uReady: { value: 0 } }
      });
      var m = new T.Mesh(geo, mat);
      m.userData = { i: i, ang: i * 2.39996 + 0.6, ar: (p.w && p.h) ? p.w / p.h : 1.3, ready: 0 };
      loader.load(p.src, function (tex) {
        tex.minFilter = T.LinearFilter;
        tex.generateMipmaps = false;
        mat.uniforms.uTex.value = tex;
        m.userData.loaded = true;
      });
      scene.add(m);
      return m;
    });

    // un cadran entre deux projets : anneau, graduations et deux aiguilles
    var ink = new T.Color(0xece5d6);
    var rings = [];
    for (var i = 0; i <= N; i++) {
      var g = new T.Group();
      var pts = [];
      for (var a = 0; a <= 128; a++) pts.push(new T.Vector3(Math.cos(a / 128 * Math.PI * 2), Math.sin(a / 128 * Math.PI * 2), 0));
      var lineMat = new T.LineBasicMaterial({ color: ink, transparent: true, opacity: 0, depthWrite: false });
      g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), lineMat));
      var tp = [];
      for (var t = 0; t < 60; t++) {
        var an = t / 60 * Math.PI * 2, r0 = t % 5 ? 0.965 : 0.92;
        tp.push(new T.Vector3(Math.sin(an), Math.cos(an), 0), new T.Vector3(Math.sin(an) * r0, Math.cos(an) * r0, 0));
      }
      g.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(tp), lineMat));
      // l'heure de ce cadran : de 9h00 au premier à 18h22 au dernier
      var mins = 9 * 60 + (18 * 60 + 22 - 9 * 60) * (i / N);
      var hand = function (len, deg) {
        var r = -deg * Math.PI / 180;
        return new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(-Math.sin(r) * len, Math.cos(r) * len, 0)]), lineMat);
      };
      g.add(hand(0.5, mins * 0.5));
      g.add(hand(0.8, mins * 6));
      g.position.z = -(i + 0.5) * GAP;
      g.userData = { mat: lineMat };
      scene.add(g);
      rings.push(g);
    }

    function layout() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      mobile = w < 700;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = mobile ? 68 : 52;
      camera.updateProjectionMatrix();
      var spreadX = mobile ? 0.55 : 1.55, spreadY = mobile ? 0.9 : 0.75, size = mobile ? 1.15 : 1.5;
      planes.forEach(function (m) {
        var u = m.userData;
        var hh = size * (u.ar < 1 ? 1.15 : 1);
        m.scale.set(hh * u.ar, hh, 1);
        m.position.set(Math.cos(u.ang) * spreadX, Math.sin(u.ang) * spreadY, -(u.i + 1) * GAP);
      });
      var rs = mobile ? 1.9 : 2.6;
      rings.forEach(function (g) { g.scale.set(rs, rs, 1); });
    }
    layout();
    window.addEventListener('resize', layout);

    var inView = false;
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; }, { rootMargin: '10% 0px' }).observe(section);

    var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX / window.innerWidth * 2 - 1;
      mouse.y = e.clientY / window.innerHeight * 2 - 1;
    }, { passive: true });

    var prog = 0, smooth = 0, vel = 0, lastTitle = -1;
    var head = $('.tunnel__head'), hint = $('.tunnel__hint');
    function progress() {
      var r = section.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      return Math.max(0, Math.min(1, -r.top / Math.max(1, span)));
    }

    function frame(t) {
      requestAnimationFrame(frame);
      if (!inView) return;
      prog = progress();
      var prev = smooth;
      smooth += (prog - smooth) * 0.085;
      vel += ((smooth - prev) * 60 - vel) * 0.15;
      mouse.sx += (mouse.x - mouse.sx) * 0.05;
      mouse.sy += (mouse.y - mouse.sy) * 0.05;

      var camZ = 3.2 - smooth * (LEN - 1.2);
      camera.position.set(mouse.sx * 0.35, -mouse.sy * 0.25, camZ);
      camera.lookAt(mouse.sx * 0.8, -mouse.sy * 0.5, camZ - 6);
      camera.rotation.z = smooth * 0.9 + vel * 0.06;

      var time = t * 0.001, nearest = -1, best = 1e9;
      planes.forEach(function (m) {
        var d = camZ - m.position.z; // distance devant la caméra
        var u = m.material.uniforms;
        var fadeIn = 1 - Math.min(1, Math.max(0, (d - GAP * 1.2) / (GAP * 3.2)));
        var near = mobile ? 2.1 : 1.0;
        var fadeOut = Math.min(1, Math.max(0, (d - near) / 1.6));
        u.uAlpha.value = fadeIn * fadeOut;
        u.uVel.value = Math.max(-0.8, Math.min(0.8, vel * 1.6));
        u.uTime.value = time;
        if (m.userData.loaded) u.uReady.value = Math.min(1, u.uReady.value + 0.04);
        m.visible = u.uAlpha.value > 0.002;
        // les images regardent légèrement la caméra
        m.rotation.y = -m.position.x * 0.12 + mouse.sx * 0.05;
        m.rotation.x = m.position.y * 0.08;
        if (d > 1.6 && d < best) { best = d; nearest = m.userData.i; }
      });
      rings.forEach(function (g) {
        var d = camZ - g.position.z;
        var a = (1 - Math.min(1, Math.max(0, (d - 3) / 14))) * Math.min(1, Math.max(0, (d - 0.2) / 1.6));
        g.userData.mat.opacity = a * 0.55;
        g.rotation.z = -smooth * 0.9;
        g.visible = a > 0.002;
      });

      head.style.opacity = Math.max(0, 1 - smooth * 9).toFixed(3);
      hint.style.opacity = Math.max(0, 1 - smooth * 6).toFixed(3);
      var show = nearest >= 0 && best < GAP * 1.4 && smooth > 0.02 ? nearest : -1;
      if (show !== lastTitle) {
        lastTitle = show;
        var txt = show >= 0 ? (PROJECTS[show].title || '') : '';
        if (window.gsap) {
          gsap.to(now, { opacity: 0, y: -8, duration: 0.2, onComplete: function () {
            now.textContent = txt;
            gsap.fromTo(now, { opacity: 0, y: 10 }, { opacity: txt ? 1 : 0, y: 0, duration: 0.6, ease: 'expo.out' });
          } });
        } else now.textContent = txt;
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);

    canvas.addEventListener('click', function () { if (window.APP) window.APP.openGallery(); });
  }


  /* ------------------------------------------------------------------------
     Showreel : un cadre au centre qui s'ouvre jusqu'au plein écran
     ------------------------------------------------------------------------ */
  (function reel() {
    var sec = $('#reel'), frame = $('#reelFrame'), video = $('#reelVideo');
    var line = $('#reelLine'), label = $('#reelLabel'), sound = $('#reelSound');
    var visible = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else video.pause();
      }, { threshold: 0.05 }).observe(sec);
    }
    sound.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted) video.play();
      sound.setAttribute('aria-pressed', String(!video.muted));
      sound.querySelector('span').textContent = COPY[current][video.muted ? 'soundOn' : 'soundOff'];
    });
    function paint() {
      requestAnimationFrame(paint);
      if (!visible) return;
      var r = sec.getBoundingClientRect();
      var vh = window.innerHeight, vw = window.innerWidth;
      var p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh)));
      var e = p < 0.62 ? 1 - Math.pow(1 - p / 0.62, 3) : 1; // ouverture, puis plein écran
      var small = vw < 700 ? 0.78 : 0.42;
      var w = vw * (small + (1 - small) * e);
      var h = Math.min(vh, w / 1.283);
      h = h + (vh - h) * e;
      var x = (vw - w) / 2, y = (vh - h) / 2;
      frame.style.clipPath = 'inset(' + y.toFixed(1) + 'px ' + x.toFixed(1) + 'px round ' + (14 * (1 - e)).toFixed(1) + 'px)';
      video.style.transform = 'scale(' + (1.18 - 0.18 * e).toFixed(4) + ')';
      line.style.opacity = Math.max(0, Math.min(1, (p - 0.55) / 0.15)).toFixed(3);
      sound.style.opacity = line.style.opacity;
      sound.style.pointerEvents = p > 0.55 ? 'auto' : 'none';
      label.style.opacity = (1 - e).toFixed(3);
    }
    paint();
  })();

  /* ------------------------------------------------------------------------
     Départ
     ------------------------------------------------------------------------ */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  window.SITE = {
    lang: function (l) {
      if (l === current) return;
      render(l);
      watchSteps();
      mc.m = 9 * 60; paintMethod();
    }
  };
  render(document.documentElement.lang && COPY[document.documentElement.lang] ? document.documentElement.lang : 'fr');
  watchSteps();
  tunnel();
  onScroll();
})();
