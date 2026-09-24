// Demande de commande : panier visuel (vraies photos de pots), stockage local, envoi de la demande par e-mail.
// Pas de paiement : la demande part chez Nathalie et Frédéric, qui rappellent le client.
import { gsap } from 'gsap';
import { products, type Size } from '../data/products';

export interface Line {
  id: string;
  size: Size;
  qty: number;
}

const KEY = 'mab-cart-v1';
const MAX_JARS = 14; // pots montrés dans le panier, au-delà : « +n »
const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
const product = (id: string) => products.find((p) => p.id === id)!;
const sizeLabel = (s: Size) => ({ '250g': '250 g', '500g': '500 g', '1kg': '1 kg' })[s];

function load(): Line[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]') as Line[];
    // on ne garde que les lignes encore disponibles
    return raw.filter((l) => products.find((p) => p.id === l.id)?.prices[l.size] != null && l.qty > 0);
  } catch {
    return [];
  }
}

let lines: Line[] = load();
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* stockage indisponible : le panier reste en mémoire */
  }
};

const price = (l: Line) => (product(l.id).prices[l.size] ?? 0) * l.qty;
const total = () => lines.reduce((s, l) => s + price(l), 0);
const count = () => lines.reduce((s, l) => s + l.qty, 0);

function change(id: string, size: Size, delta: number) {
  const l = lines.find((x) => x.id === id && x.size === size);
  if (l) l.qty += delta;
  else if (delta > 0) lines.push({ id, size, qty: delta });
  lines = lines.filter((x) => x.qty > 0);
  save();
  render();
}

export function initCart(opts: { lock: (locked: boolean) => void }) {
  const root = $('[data-cart]');
  const panel = $('[data-cart-panel]', root);
  const veil = $('.cart__veil', root);
  const list = $('[data-cart-items]', root);
  const form = $<HTMLFormElement>('[data-cart-form]', root);
  const mobile = () => window.matchMedia('(max-width: 560px)').matches;

  // position de départ gérée par GSAP (hors écran)
  gsap.set(panel, mobile() ? { yPercent: 100 } : { xPercent: 100 });
  let open = false;

  const show = () => {
    if (open) return;
    open = true;
    render();
    document.documentElement.classList.add('cart-open');
    gsap
      .timeline()
      .set(root, { visibility: 'visible' })
      .to(veil, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(
        panel,
        mobile() ? { yPercent: 100, xPercent: 0 } : { xPercent: 100, yPercent: 0 },
        { xPercent: 0, yPercent: 0, duration: 0.8, ease: 'expo.out' },
        0,
      )
      .from($$('.cart__head, [data-cart-items] li, .cart__empty > *, .cart__form > *, .cart__foot', root), {
        y: 30,
        opacity: 0,
        stagger: 0.04,
        duration: 0.6,
        ease: 'power3.out',
      }, 0.15);
    root.setAttribute('aria-hidden', 'false');
    opts.lock(true);
    setTimeout(() => $<HTMLButtonElement>('.cart__x', root).focus({ preventScroll: true }), 300);
  };
  const hide = () => {
    if (!open) return;
    open = false;
    document.documentElement.classList.remove('cart-open');
    root.setAttribute('aria-hidden', 'true');
    gsap.to(veil, { opacity: 0, duration: 0.4 });
    gsap.to(panel, {
      ...(mobile() ? { yPercent: 100 } : { xPercent: 100 }),
      duration: 0.6,
      ease: 'expo.inOut',
      onComplete: () => void gsap.set(root, { visibility: 'hidden' }),
    });
    opts.lock(false);
  };

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const jar = t.closest<HTMLElement>('.pj:not(span)');
    if (jar) {
      // retirer un pot de la caisse
      // c'est le pot touché qui s'en va : il échange sa clé avec le dernier pot de la même sorte
      const [id, size] = jar.dataset.key!.split('|');
      const last = `${id}|${size}|${(lines.find((l) => l.id === id && l.size === size)?.qty ?? 1) - 1}`;
      const box = jar.parentElement!;
      const other = box.querySelector<HTMLElement>(`.pj[data-key="${last}"]`);
      if (other && other !== jar) [other.dataset.key, jar.dataset.key] = [jar.dataset.key, last];
      change(id, size as Size, -1);
      return;
    }
    if (t.closest('[data-cart-open]')) {
      e.preventDefault();
      show();
    } else if (t.closest('[data-cart-close]')) hide();
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && hide());

  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-act]');
    if (!b) return;
    const l = lines[Number(b.closest('li')!.dataset.i)];
    const act = b.dataset.act;
    change(l.id, l.size, act === 'plus' ? 1 : act === 'minus' ? -1 : -l.qty);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!lines.length) return;
    const fd = new FormData(form);
    const body = [
      'Bonjour Nathalie et Frédéric,',
      '',
      'Je souhaiterais réserver :',
      ...lines.map((l) => {
        const p = product(l.id);
        return `• ${l.qty} × ${p.name} ${p.year} — ${sizeLabel(l.size)} (${price(l)} €)`;
      }),
      '',
      `Estimation : ${total()} €`,
      `Récupération : ${fd.get('pickup')}`,
      '',
      `Nom : ${fd.get('name')}`,
      `Téléphone : ${fd.get('phone')}`,
      fd.get('email') ? `E-mail : ${fd.get('email')}` : '',
      fd.get('message') ? `\nMessage : ${fd.get('message')}` : '',
      '',
      'Merci !',
    ]
      .filter((x) => x !== '')
      .join('\n');
    const subject = `Demande de commande — ${fd.get('name')}`;
    // la messagerie ne s'ouvre pas partout (navigateur sans client mail, aperçu intégré) :
    // on affiche toujours le message prêt à copier
    $<HTMLTextAreaElement>('[data-sent-text]', root).value = `Objet : ${subject}\n\n${body}`;
    $('[data-sent]', root).hidden = false;
    root.classList.add('is-sent');
    gsap.from($$('[data-sent] > *', root), { y: 20, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out' });
    try {
      window.location.href = `mailto:${root.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch {
      /* pas de messagerie : le texte reste affiché */
    }
  });

  const copyLabel = $('[data-sent-copy-label]', root);
  $('[data-sent-copy]', root).addEventListener('click', () => {
    const ta = $<HTMLTextAreaElement>('[data-sent-text]', root);
    const done = () => (copyLabel.textContent = 'Message copié');
    navigator.clipboard?.writeText(ta.value).then(done, () => {
      ta.select();
      copyLabel.textContent = 'Texte sélectionné';
    }) ?? (ta.select(), done());
  });
  $('[data-sent-back]', root).addEventListener('click', () => {
    $('[data-sent]', root).hidden = true;
    root.classList.remove('is-sent');
    copyLabel.textContent = 'Copier le message';
  });

  render();
  return { show, hide };
}

const thumb = () => document.querySelector<HTMLElement>('[data-basket]')?.dataset.thumb ?? '';
const tint = (id: string) => (id.startsWith('printemps') ? 'is-printemps' : '');

const photoJar = (id: string, size: Size, key: string, decorative = false) => {
  const p = product(id);
  if (decorative)
    return `<span class="pj pj--${size} ${id.startsWith('printemps') ? 'pj--printemps' : ''}" data-key="${key}"><img src="${thumb()}" alt=""></span>`;
  return `<button type="button" class="pj pj--${size} ${id.startsWith('printemps') ? 'pj--printemps' : ''}" data-key="${key}"
    data-cap="${p.name} · ${sizeLabel(size)}" aria-label="Retirer un pot ${p.name} ${sizeLabel(size)}"><img src="${thumb()}" alt=""></button>`;
};

// Pots du panier visuel : on n'anime que ceux qui arrivent ou partent
function renderTrays() {
  const keys: [string, Line][] = [];
  for (const l of lines) for (let n = 0; n < l.qty; n++) keys.push([`${l.id}|${l.size}|${n}`, l]);
  const shown = keys.slice(0, MAX_JARS);
  const extra = keys.length - shown.length;

  $$('[data-tray-jars]').forEach((box) => {
    const existing = new Map($$<HTMLElement>('.pj', box).map((el) => [el.dataset.key!, el]));
    const wanted = new Set(shown.map(([k]) => k));
    existing.forEach((el, k) => {
      if (wanted.has(k)) return;
      el.dataset.key = `gone-${k}`;
      gsap.to(el, { yPercent: 110, opacity: 0, duration: 0.6, ease: 'expo.in', onComplete: () => el.remove() });
    });
    shown.forEach(([k, l], i) => {
      let el = existing.get(k);
      if (!el) {
        box.insertAdjacentHTML('beforeend', photoJar(l.id, l.size, k, !!box.closest('[data-dock]')));
        el = box.lastElementChild as HTMLElement;
        gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)', y: 30 }, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.1, ease: 'expo.out' });
        gsap.fromTo(el.querySelector('img'), { scale: 1.4 }, { scale: 1, duration: 1.4, ease: 'expo.out' });
      }
      el.style.order = String(i);
    });
    box.querySelector('.pj-more')?.remove();
    if (extra > 0) box.insertAdjacentHTML('beforeend', `<span class="pj-more" style="order:${MAX_JARS}">+${extra}</span>`);
    // les pots se serrent sur une seule rangée quand la place manque
    const jars = $$<HTMLElement>('.pj:not([data-key^="gone"])', box);
    const need = jars.reduce((w, el) => w + el.offsetWidth + 4, 0);
    const over = jars.length > 1 ? Math.max(0, (need - box.clientWidth + 20) / (jars.length - 1)) : 0;
    jars.forEach((el, i) => (el.style.marginLeft = i && over ? `${-over}px` : ''));
  });
}

function render() {
  const has = lines.length > 0;
  document.documentElement.classList.toggle('has-items', has);
  const root = $('[data-cart]');
  root.classList.toggle('has-items', has);

  $('[data-cart-items]', root).innerHTML = lines
    .map((l, i) => {
      const p = product(l.id);
      return `<li data-i="${i}">
        <img class="ci-img ${tint(l.id)}" src="${thumb()}" alt="">
        <div>
          <p class="ci-name">${p.name} ${p.year}</p>
          <p class="ci-meta">${sizeLabel(l.size)} · ${price(l)} €</p>
        </div>
        <div class="ci-qty">
          <button type="button" data-act="minus" aria-label="Retirer un pot">−</button>
          <span>${l.qty}</span>
          <button type="button" data-act="plus" aria-label="Ajouter un pot">+</button>
        </div>
      </li>`;
    })
    .join('');

  const n = count();
  $$('[data-cart-total]').forEach((el) => (el.textContent = `${total()} €`));
  $$('[data-cart-count]').forEach((el) => (el.textContent = String(n)));
  $$('[data-cart-word]').forEach((el) => (el.textContent = n > 1 ? 'pots' : 'pot'));
  $$<HTMLButtonElement>('[data-basket-send]').forEach((b) => (b.disabled = !has));
  renderTrays();
}

export function addToCart(id: string, size: Size, qty = 1) {
  change(id, size, qty);
  $$('[data-cart-count]').forEach((c) => {
    c.classList.remove('bump');
    void c.offsetWidth;
    c.classList.add('bump');
  });
}
