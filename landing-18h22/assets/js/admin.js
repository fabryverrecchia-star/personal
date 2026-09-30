/* Admin 18H22 : liste des projets (ordre, titres, suppression) et ajout d'images. */
(function () {
  'use strict';

  var state = (window.ADMIN.projects || []).slice();
  var csrf = window.ADMIN.csrf;
  var list = document.getElementById('list');
  var savebar = document.getElementById('savebar');
  var toastEl = document.getElementById('toast');
  var dirty = false;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }

  function setDirty(v) {
    dirty = v;
    savebar.hidden = !v;
  }

  function api(action, data) {
    var fd = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData) && data) Object.keys(data).forEach(function (k) { fd.append(k, data[k]); });
    fd.append('csrf', csrf);
    return fetch('admin.php?api=' + action, { method: 'POST', body: fd, credentials: 'same-origin' })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !j.ok) {
            var e = new Error(j.error || 'http');
            e.code = j.error || r.status;
            throw e;
          }
          return j;
        });
      });
  }

  function explain(err) {
    if (err.code === 'auth' || err.code === 'csrf') return 'Session expirée : rechargez la page.';
    if (err.code === 'write') return 'Le serveur refuse l’écriture : vérifiez les droits des dossiers.';
    if (err.code === 'type') return 'Format non accepté : JPEG, PNG ou WebP.';
    return 'L’opération n’a pas abouti. Réessayez.';
  }

  /* ---- Liste ---- */
  function render() {
    list.innerHTML = '';
    state.forEach(function (p, i) {
      var li = document.createElement('li');
      li.className = 'card';
      li.draggable = true;
      li.dataset.index = i;
      li.innerHTML =
        '<div class="card__img"><img src="' + p.src + '" alt="" loading="lazy"></div>' +
        '<div class="card__body">' +
          '<span class="card__num">N° ' + String(i + 1).padStart(2, '0') + '</span>' +
          '<input class="card__title" type="text" maxlength="80" placeholder="Titre (facultatif)" aria-label="Titre du projet ' + (i + 1) + '">' +
          '<div class="card__tools">' +
            '<button type="button" data-act="up" aria-label="Monter">↑</button>' +
            '<button type="button" data-act="down" aria-label="Descendre">↓</button>' +
            '<button type="button" data-act="del" class="card__del">Supprimer</button>' +
          '</div>' +
        '</div>';
      li.querySelector('.card__title').value = p.title || '';
      list.appendChild(li);
    });
    document.getElementById('count').textContent = state.length;
  }

  list.addEventListener('input', function (e) {
    if (!e.target.classList.contains('card__title')) return;
    var i = +e.target.closest('.card').dataset.index;
    state[i].title = e.target.value;
    setDirty(true);
  });

  list.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var card = b.closest('.card');
    var i = +card.dataset.index;
    var act = b.dataset.act;
    if (act === 'up' && i > 0) { move(i, i - 1); }
    if (act === 'down' && i < state.length - 1) { move(i, i + 1); }
    if (act === 'del') {
      // deux temps : le premier clic demande confirmation sur le bouton lui-même
      if (!b.classList.contains('is-confirm')) {
        b.classList.add('is-confirm');
        b.textContent = 'Confirmer ?';
        setTimeout(function () { if (b.isConnected) { b.classList.remove('is-confirm'); b.textContent = 'Supprimer'; } }, 3500);
        return;
      }
      state.splice(i, 1);
      render();
      setDirty(true);
    }
  });

  function move(from, to) {
    var it = state.splice(from, 1)[0];
    state.splice(to, 0, it);
    render();
    setDirty(true);
    var el = list.children[to];
    if (el) el.classList.add('is-moved');
  }

  // Glisser-déposer (ordinateur)
  var dragFrom = -1;
  list.addEventListener('dragstart', function (e) {
    var card = e.target.closest('.card');
    if (!card || e.target.tagName === 'INPUT') return;
    dragFrom = +card.dataset.index;
    card.classList.add('is-drag');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragFrom));
  });
  list.addEventListener('dragover', function (e) {
    if (dragFrom < 0) return;
    e.preventDefault();
    var card = e.target.closest('.card');
    Array.prototype.forEach.call(list.children, function (c) { c.classList.toggle('is-target', c === card); });
  });
  list.addEventListener('drop', function (e) {
    if (dragFrom < 0) return;
    e.preventDefault();
    var card = e.target.closest('.card');
    if (card) move(dragFrom, +card.dataset.index);
    dragFrom = -1;
  });
  list.addEventListener('dragend', function () {
    dragFrom = -1;
    Array.prototype.forEach.call(list.children, function (c) { c.classList.remove('is-drag', 'is-target'); });
  });

  /* ---- Enregistrer ---- */
  document.getElementById('save').addEventListener('click', function () {
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Enregistrement…';
    api('save', {
      list: JSON.stringify(state.map(function (p) { return { id: p.id, title: p.title || '' }; })),
      settings: JSON.stringify(settings)
    })
      .then(function () { setDirty(false); toast('Enregistré. Le site est à jour.'); })
      .catch(function (err) { toast(explain(err)); })
      .then(function () { btn.disabled = false; btn.textContent = 'Enregistrer'; });
  });

  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  document.getElementById('logout').addEventListener('click', function () {
    api('logout').catch(function () {}).then(function () { location.href = 'admin.php'; });
  });

  /* ---- Ajout d'images ---- */
  var queue = document.getElementById('queue');
  var drop = document.getElementById('drop');
  var fileInput = document.getElementById('file');

  // Réduit l'image dans le navigateur (1600 px max) : envoi rapide, même depuis un téléphone
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = 1600;
        var s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * s);
        c.height = Math.round(img.naturalHeight * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (b && b.type === 'image/webp') return resolve({ blob: b, name: 'image.webp' });
          c.toBlob(function (j) { j ? resolve({ blob: j, name: 'image.jpg' }) : reject(new Error('type')); }, 'image/jpeg', 0.84);
        }, 'image/webp', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); var e = new Error('type'); e.code = 'type'; reject(e); };
      img.src = url;
    });
  }

  function upload(files) {
    var arr = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type); });
    if (!arr.length) return;
    var chain = Promise.resolve();
    arr.forEach(function (f) {
      var row = document.createElement('div');
      row.className = 'queue__row';
      row.textContent = f.name + ' · en attente';
      queue.appendChild(row);
      chain = chain.then(function () {
        row.textContent = f.name + ' · envoi…';
        return shrink(f).then(function (r) {
          var fd = new FormData();
          fd.append('image', r.blob, r.name);
          return api('upload', fd);
        }).then(function (res) {
          state.push(res.item);
          render();
          row.textContent = f.name + ' · ajouté';
          row.classList.add('is-ok');
          setTimeout(function () { row.remove(); }, 2500);
        }).catch(function (err) {
          row.textContent = f.name + ' · ' + explain(err);
          row.classList.add('is-err');
        });
      });
    });
    chain.then(function () {
      toast(dirty ? 'Images ajoutées. Pensez à enregistrer vos autres modifications.' : 'Images ajoutées au site.');
    });
  }

  fileInput.addEventListener('change', function () { upload(fileInput.files); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) {
    drop.addEventListener(t, function (e) { if (dragFrom < 0) { e.preventDefault(); drop.classList.add('is-over'); } });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    drop.addEventListener(t, function () { drop.classList.remove('is-over'); });
  });
  drop.addEventListener('drop', function (e) {
    if (dragFrom >= 0) return;
    e.preventDefault();
    upload(e.dataTransfer.files);
  });

  /* ---- Réglages de l'animation ---- */
  var settings = Object.assign({}, window.ADMIN.settings);
  var ranges = Array.prototype.slice.call(document.querySelectorAll('#settings input[type=range]'));

  function showSetting(input) {
    var o = document.querySelector('output[data-for="' + input.dataset.key + '"]');
    o.textContent = (input.dataset.prefix || '') + String(input.value).replace('.', ',') + (input.dataset.unit || '');
  }
  function fillSettings() {
    ranges.forEach(function (r) { r.value = settings[r.dataset.key]; showSetting(r); });
  }
  ranges.forEach(function (r) {
    r.addEventListener('input', function () {
      settings[r.dataset.key] = parseFloat(r.value);
      showSetting(r);
      setDirty(true);
    });
  });
  document.getElementById('resetSettings').addEventListener('click', function () {
    settings = Object.assign({}, window.ADMIN.defaults);
    fillSettings();
    setDirty(true);
  });
  fillSettings();

  render();
})();
