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
      cue: 'Découvrir l’agence',
      reelLabel: 'Showreel', reelLine: 'Paris, de l’aube à 18h22.', soundOn: 'Avec le son', soundOff: 'Couper le son',
      introLabel: 'L’agence',
      introTitle: '18H22 donne une image aux lieux qui reçoivent : restaurants, hôtels, bars, maisons de musique.',
      introText: 'Nous pensons l’identité, nous la photographions et nous la publions, chaque semaine. Une seule équipe, de la direction artistique au post du mardi : votre lieu garde la même voix à table, sur la carte et dans le feed.',
      ctaTalk: 'Parler de votre lieu', ctaWork: 'Voir les projets', ctaMeet: 'Prendre rendez-vous', ctaFloat: 'Parler de votre lieu',
      offerLabel: 'Ce que nous faisons', offerTitle: 'Tout ce qui fait venir, et revenir.',
      offer: [
        { t: 'Direction artistique', d: 'Le socle qui rend votre lieu reconnaissable au premier regard.', i: ['Logo et identité', 'Charte, couleurs, typographies', 'Direction photo', 'Menus, cartes, signalétique'] },
        { t: 'Photo et vidéo', d: 'Des images qui donnent envie de venir, et de rester.', i: ['Shootings culinaires et d’ambiance', 'Portraits des équipes', 'Reels et formats courts', 'Jours de passage planifiés'] },
        { t: 'Réseaux sociaux', d: 'Un plan du mois pensé à l’avance, validé avec vous, publié pour vous.', i: ['Planning mensuel des posts', 'Légendes rédigées', 'Campagnes sponsorisées et budget', 'Suivi et ajustements'] },
        { t: 'Lancements', d: 'Une ouverture, une nouvelle carte, une soirée : un temps fort préparé de bout en bout.', i: ['Teasing et calendrier', 'Invitations et print', 'Couverture photo et vidéo', 'Contenus d’après'] }
      ],
      workLabel: 'Sélection', workTitle: 'Traversez le temps, projet après projet.', workHint: 'Faites défiler pour avancer', workAll: 'Tout l’index',
      spaceLabel: 'Votre espace 18H22', spaceTitle: 'Votre mois entier, dans votre poche.',
      spaceText: 'Chaque client reçoit sa page privée. Le plan du mois, les visuels à valider, les jours de shooting et les missions en cours : tout est au même endroit, sur votre téléphone. Plus de fils d’e-mails, plus de fichiers perdus.',
      spaceList: ['Le mois en aperçu, comme dans votre feed', 'Chaque post validé en un geste', 'Les jours de shooting dans le calendrier', 'Les campagnes et leur budget, en clair'],
      phoneMonth: 'Novembre', phoneRow1: 'Mardi 14 · Shooting nouvelle carte', phoneRow2: 'Reel d’ouverture · validé',
      methodLabel: 'Une journée avec nous', methodTitle: 'De la première visite à 18h22.',
      steps: [
        { h: 9, m: 0, t: 'Rencontre', d: 'Nous venons chez vous, nous goûtons, nous écoutons. Nous repartons avec ce qui rend votre lieu unique.' },
        { h: 11, m: 30, t: 'Direction', d: 'Une direction claire : images, ton, rythme. Vous validez avant la moindre production.' },
        { h: 15, m: 0, t: 'Production', d: 'Shootings, visuels, légendes. Tout arrive dans votre espace pour validation.' },
        { h: 18, m: 22, t: 'Publication', d: 'Les posts sortent au bon moment, les campagnes tournent. Chaque mois, on mesure et on ajuste.' }
      ],
      plansLabel: 'Travailler ensemble', plansTitle: 'Trois façons de commencer.',
      plans: [
        { k: 'monthly', t: 'Accompagnement mensuel', d: 'Pour les lieux qui veulent exister chaque semaine.', i: ['Plan média du mois', 'Shooting mensuel', 'Publication et légendes', 'Campagnes sponsorisées', 'Votre espace 18H22'], c: 'Demander un devis' },
        { k: 'identity', t: 'Identité', d: 'Pour une ouverture ou un nouveau départ.', i: ['Logo et charte', 'Direction artistique', 'Menus et print', 'Shooting de lancement'], c: 'Demander un devis' },
        { k: 'shoot', t: 'Shooting', d: 'Pour renouveler vos images, vite et bien.', i: ['Demi-journée ou journée', 'Retouche et sélection', 'Formats prêts pour les réseaux'], c: 'Réserver une date' }
      ],
      quote: 'Sur devis',
      clientsLabel: 'Ils nous confient leur image',
      endTitle: 'Votre lieu a son heure. Trouvons-la ensemble.',
      endText: 'Un premier rendez-vous pour comprendre votre lieu, puis une proposition claire avec le plan du premier mois.',
      navOffer: 'Offre', navWork: 'Projets', navMethod: 'Méthode', navContact: 'Contact',
      need: 'Votre besoin', needMonthly: 'Accompagnement mensuel', needIdentity: 'Identité', needShoot: 'Shooting', needOther: 'Autre'
    },
    en: {
      cue: 'Discover the agency',
      reelLabel: 'Showreel', reelLine: 'Paris, from dawn to 18:22.', soundOn: 'Sound on', soundOff: 'Sound off',
      introLabel: 'The agency',
      introTitle: '18H22 gives an image to places that welcome people: restaurants, hotels, bars, music houses.',
      introText: 'We shape the identity, we photograph it and we publish it, every week. One team, from art direction to Tuesday’s post: your place keeps the same voice at the table, on the menu and in the feed.',
      ctaTalk: 'Talk about your place', ctaWork: 'See the work', ctaMeet: 'Book a meeting', ctaFloat: 'Talk about your place',
      offerLabel: 'What we do', offerTitle: 'Everything that makes people come, and come back.',
      offer: [
        { t: 'Art direction', d: 'The foundation that makes your place recognisable at first glance.', i: ['Logo and identity', 'Guidelines, colours, typefaces', 'Photo direction', 'Menus, cards, signage'] },
        { t: 'Photo and video', d: 'Images that make people want to come, and to stay.', i: ['Food and atmosphere shoots', 'Team portraits', 'Reels and short formats', 'Planned shooting days'] },
        { t: 'Social media', d: 'A monthly plan thought out ahead, approved with you, published for you.', i: ['Monthly post planning', 'Written captions', 'Sponsored campaigns and budget', 'Tracking and adjustments'] },
        { t: 'Launches', d: 'An opening, a new menu, an evening: a key moment prepared end to end.', i: ['Teasing and calendar', 'Invitations and print', 'Photo and video coverage', 'Follow-up content'] }
      ],
      workLabel: 'Selection', workTitle: 'Travel through time, project after project.', workHint: 'Scroll to move forward', workAll: 'Full index',
      spaceLabel: 'Your 18H22 space', spaceTitle: 'Your whole month, in your pocket.',
      spaceText: 'Every client gets a private page. The month’s plan, the visuals to approve, the shooting days and the work in progress: everything in one place, on your phone. No more email threads, no more lost files.',
      spaceList: ['The month at a glance, as in your feed', 'Every post approved in one tap', 'Shooting days in the calendar', 'Campaigns and their budget, clearly'],
      phoneMonth: 'November', phoneRow1: 'Tuesday 14 · New menu shoot', phoneRow2: 'Opening reel · approved',
      methodLabel: 'A day with us', methodTitle: 'From the first visit to 18:22.',
      steps: [
        { h: 9, m: 0, t: 'Meeting', d: 'We come to your place, we taste, we listen. We leave with what makes it unique.' },
        { h: 11, m: 30, t: 'Direction', d: 'A clear direction: images, tone, rhythm. You approve before anything is produced.' },
        { h: 15, m: 0, t: 'Production', d: 'Shoots, visuals, captions. Everything lands in your space for approval.' },
        { h: 18, m: 22, t: 'Publishing', d: 'Posts go out at the right time, campaigns run. Every month we measure and adjust.' }
      ],
      plansLabel: 'Working together', plansTitle: 'Three ways to start.',
      plans: [
        { k: 'monthly', t: 'Monthly partnership', d: 'For places that want to be seen every week.', i: ['Monthly media plan', 'Monthly shoot', 'Publishing and captions', 'Sponsored campaigns', 'Your 18H22 space'], c: 'Ask for a quote' },
        { k: 'identity', t: 'Identity', d: 'For an opening or a fresh start.', i: ['Logo and guidelines', 'Art direction', 'Menus and print', 'Launch shoot'], c: 'Ask for a quote' },
        { k: 'shoot', t: 'Shoot', d: 'To renew your images, fast and well.', i: ['Half day or full day', 'Retouching and selection', 'Formats ready for social'], c: 'Book a date' }
      ],
      quote: 'On quotation',
      clientsLabel: 'They trust us with their image',
      endTitle: 'Your place has its hour. Let’s find it together.',
      endText: 'A first meeting to understand your place, then a clear proposal with the plan for the first month.',
      navOffer: 'Services', navWork: 'Work', navMethod: 'Method', navContact: 'Contact',
      need: 'What you need', needMonthly: 'Monthly partnership', needIdentity: 'Identity', needShoot: 'Shoot', needOther: 'Other'
    },
    es: {
      cue: 'Descubrir la agencia',
      reelLabel: 'Showreel', reelLine: 'París, del alba a las 18:22.', soundOn: 'Con sonido', soundOff: 'Sin sonido',
      introLabel: 'La agencia',
      introTitle: '18H22 da imagen a los lugares que reciben: restaurantes, hoteles, bares, casas de música.',
      introText: 'Pensamos la identidad, la fotografiamos y la publicamos, cada semana. Un solo equipo, de la dirección de arte al post del martes: tu lugar mantiene la misma voz en la mesa, en la carta y en el feed.',
      ctaTalk: 'Hablar de tu lugar', ctaWork: 'Ver los proyectos', ctaMeet: 'Pedir una cita', ctaFloat: 'Hablar de tu lugar',
      offerLabel: 'Lo que hacemos', offerTitle: 'Todo lo que hace venir, y volver.',
      offer: [
        { t: 'Dirección de arte', d: 'La base que hace tu lugar reconocible a primera vista.', i: ['Logo e identidad', 'Manual, colores, tipografías', 'Dirección fotográfica', 'Menús, cartas, señalética'] },
        { t: 'Foto y vídeo', d: 'Imágenes que dan ganas de venir, y de quedarse.', i: ['Sesiones gastronómicas y de ambiente', 'Retratos del equipo', 'Reels y formatos cortos', 'Días de rodaje planificados'] },
        { t: 'Redes sociales', d: 'Un plan mensual pensado con antelación, validado contigo, publicado por nosotros.', i: ['Planificación mensual', 'Textos redactados', 'Campañas patrocinadas y presupuesto', 'Seguimiento y ajustes'] },
        { t: 'Lanzamientos', d: 'Una apertura, una nueva carta, una velada: un momento clave preparado de principio a fin.', i: ['Teasing y calendario', 'Invitaciones e impresos', 'Cobertura de foto y vídeo', 'Contenidos posteriores'] }
      ],
      workLabel: 'Selección', workTitle: 'Atraviesa el tiempo, proyecto tras proyecto.', workHint: 'Desplázate para avanzar', workAll: 'Índice completo',
      spaceLabel: 'Tu espacio 18H22', spaceTitle: 'Tu mes entero, en el bolsillo.',
      spaceText: 'Cada cliente recibe su página privada. El plan del mes, los visuales por validar, los días de rodaje y las misiones en curso: todo en un mismo lugar, en tu teléfono. Sin cadenas de correos ni archivos perdidos.',
      spaceList: ['El mes de un vistazo, como en tu feed', 'Cada post validado con un gesto', 'Los días de rodaje en el calendario', 'Las campañas y su presupuesto, claros'],
      phoneMonth: 'Noviembre', phoneRow1: 'Martes 14 · Sesión nueva carta', phoneRow2: 'Reel de apertura · validado',
      methodLabel: 'Un día con nosotros', methodTitle: 'De la primera visita a las 18:22.',
      steps: [
        { h: 9, m: 0, t: 'Encuentro', d: 'Vamos a tu lugar, probamos, escuchamos. Nos llevamos lo que lo hace único.' },
        { h: 11, m: 30, t: 'Dirección', d: 'Una dirección clara: imágenes, tono, ritmo. Validas antes de cualquier producción.' },
        { h: 15, m: 0, t: 'Producción', d: 'Sesiones, visuales, textos. Todo llega a tu espacio para validar.' },
        { h: 18, m: 22, t: 'Publicación', d: 'Los posts salen en el momento justo, las campañas funcionan. Cada mes medimos y ajustamos.' }
      ],
      plansLabel: 'Trabajar juntos', plansTitle: 'Tres maneras de empezar.',
      plans: [
        { k: 'monthly', t: 'Acompañamiento mensual', d: 'Para los lugares que quieren existir cada semana.', i: ['Plan de medios mensual', 'Sesión mensual', 'Publicación y textos', 'Campañas patrocinadas', 'Tu espacio 18H22'], c: 'Pedir presupuesto' },
        { k: 'identity', t: 'Identidad', d: 'Para una apertura o un nuevo comienzo.', i: ['Logo y manual', 'Dirección de arte', 'Menús e impresos', 'Sesión de lanzamiento'], c: 'Pedir presupuesto' },
        { k: 'shoot', t: 'Sesión de fotos', d: 'Para renovar tus imágenes, rápido y bien.', i: ['Media jornada o jornada', 'Retoque y selección', 'Formatos listos para redes'], c: 'Reservar fecha' }
      ],
      quote: 'Bajo presupuesto',
      clientsLabel: 'Nos confían su imagen',
      endTitle: 'Tu lugar tiene su hora. Encontrémosla juntos.',
      endText: 'Una primera cita para entender tu lugar, y luego una propuesta clara con el plan del primer mes.',
      navOffer: 'Servicios', navWork: 'Proyectos', navMethod: 'Método', navContact: 'Contacto',
      need: 'Lo que necesitas', needMonthly: 'Acompañamiento mensual', needIdentity: 'Identidad', needShoot: 'Sesión de fotos', needOther: 'Otro'
    },
    it: {
      cue: 'Scopri l’agenzia',
      reelLabel: 'Showreel', reelLine: 'Parigi, dall’alba alle 18:22.', soundOn: 'Con l’audio', soundOff: 'Senza audio',
      introLabel: 'L’agenzia',
      introTitle: '18H22 dà un’immagine ai luoghi che accolgono: ristoranti, hotel, bar, case della musica.',
      introText: 'Pensiamo l’identità, la fotografiamo e la pubblichiamo, ogni settimana. Un’unica squadra, dalla direzione artistica al post del martedì: il tuo locale mantiene la stessa voce a tavola, sul menu e nel feed.',
      ctaTalk: 'Parliamo del tuo locale', ctaWork: 'Vedi i progetti', ctaMeet: 'Fissa un appuntamento', ctaFloat: 'Parliamo del tuo locale',
      offerLabel: 'Cosa facciamo', offerTitle: 'Tutto ciò che fa venire, e tornare.',
      offer: [
        { t: 'Direzione artistica', d: 'La base che rende il tuo locale riconoscibile al primo sguardo.', i: ['Logo e identità', 'Manuale, colori, caratteri', 'Direzione fotografica', 'Menu, carte, segnaletica'] },
        { t: 'Foto e video', d: 'Immagini che fanno venire voglia di venire, e di restare.', i: ['Shooting di piatti e atmosfera', 'Ritratti dello staff', 'Reel e formati brevi', 'Giornate di shooting pianificate'] },
        { t: 'Social media', d: 'Un piano mensile pensato in anticipo, approvato con te, pubblicato per te.', i: ['Planning mensile dei post', 'Didascalie scritte', 'Campagne sponsorizzate e budget', 'Monitoraggio e aggiustamenti'] },
        { t: 'Lanci', d: 'Un’apertura, un nuovo menu, una serata: un momento chiave preparato dall’inizio alla fine.', i: ['Teasing e calendario', 'Inviti e stampa', 'Copertura foto e video', 'Contenuti del dopo'] }
      ],
      workLabel: 'Selezione', workTitle: 'Attraversa il tempo, progetto dopo progetto.', workHint: 'Scorri per avanzare', workAll: 'Indice completo',
      spaceLabel: 'Il tuo spazio 18H22', spaceTitle: 'Il tuo mese intero, in tasca.',
      spaceText: 'Ogni cliente riceve la sua pagina privata. Il piano del mese, i visual da approvare, le giornate di shooting e le attività in corso: tutto in un solo posto, sul tuo telefono. Basta catene di email e file persi.',
      spaceList: ['Il mese a colpo d’occhio, come nel feed', 'Ogni post approvato con un gesto', 'Le giornate di shooting nel calendario', 'Le campagne e il loro budget, chiari'],
      phoneMonth: 'Novembre', phoneRow1: 'Martedì 14 · Shooting nuovo menu', phoneRow2: 'Reel d’apertura · approvato',
      methodLabel: 'Una giornata con noi', methodTitle: 'Dalla prima visita alle 18:22.',
      steps: [
        { h: 9, m: 0, t: 'Incontro', d: 'Veniamo da te, assaggiamo, ascoltiamo. Ripartiamo con ciò che rende unico il tuo locale.' },
        { h: 11, m: 30, t: 'Direzione', d: 'Una direzione chiara: immagini, tono, ritmo. Approvi prima di qualsiasi produzione.' },
        { h: 15, m: 0, t: 'Produzione', d: 'Shooting, visual, didascalie. Tutto arriva nel tuo spazio per l’approvazione.' },
        { h: 18, m: 22, t: 'Pubblicazione', d: 'I post escono al momento giusto, le campagne girano. Ogni mese misuriamo e aggiustiamo.' }
      ],
      plansLabel: 'Lavorare insieme', plansTitle: 'Tre modi per iniziare.',
      plans: [
        { k: 'monthly', t: 'Accompagnamento mensile', d: 'Per i locali che vogliono esistere ogni settimana.', i: ['Piano media del mese', 'Shooting mensile', 'Pubblicazione e didascalie', 'Campagne sponsorizzate', 'Il tuo spazio 18H22'], c: 'Chiedi un preventivo' },
        { k: 'identity', t: 'Identità', d: 'Per un’apertura o un nuovo inizio.', i: ['Logo e manuale', 'Direzione artistica', 'Menu e stampa', 'Shooting di lancio'], c: 'Chiedi un preventivo' },
        { k: 'shoot', t: 'Shooting', d: 'Per rinnovare le tue immagini, presto e bene.', i: ['Mezza giornata o giornata', 'Ritocco e selezione', 'Formati pronti per i social'], c: 'Prenota una data' }
      ],
      quote: 'Su preventivo',
      clientsLabel: 'Ci affidano la loro immagine',
      endTitle: 'Il tuo locale ha la sua ora. Troviamola insieme.',
      endText: 'Un primo incontro per capire il tuo locale, poi una proposta chiara con il piano del primo mese.',
      navOffer: 'Servizi', navWork: 'Progetti', navMethod: 'Metodo', navContact: 'Contatti',
      need: 'Di cosa hai bisogno', needMonthly: 'Accompagnamento mensile', needIdentity: 'Identità', needShoot: 'Shooting', needOther: 'Altro'
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
        '<div class="offer__body"><p>' + esc(o.d) + '</p><ul>' +
        o.i.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></li>';
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
    renderer.setClearColor(0x10162a, 1);
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
      '  vec3 bg = vec3(0.063, 0.086, 0.165);',
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
