// Demande de commande : panier visuel (caisse), stockage local, envoi de la demande par e-mail.
// Pas de paiement : la demande part chez Nathalie et Frédéric, qui rappellent le client.
import { gsap } from 'gsap';
import { products, type Size } from '../data/products';

export interface Line {
  id: string;
  size: Size;
  qty: number;
}

const KEY = 'mab-cart-v1';
const MAX_JARS = 18; // pots dessinés dans la caisse, au-delà : pastille « +n »
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
      .from($$('.cart__head, .cart__crate, [data-cart-items] li, .cart__empty > *, .cart__form > *, .cart__foot', root), {
        y: 30,
        opacity: 0,
        stagger: 0.04,
        duration: 0.6,
        ease: 'power3.out',
      }, 0.15)
      .from($$('.mj', root), { y: -80, opacity: 0, stagger: 0.04, duration: 0.9, ease: 'bounce.out' }, 0.3);
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
    const jar = t.closest<HTMLElement>('.mj');
    if (jar) {
      // retirer un pot de la caisse
      // c'est le pot touché qui s'en va : il échange sa clé avec le dernier pot de la même sorte
      const [id, size] = jar.dataset.key!.split('|');
      const last = `${id}|${size}|${(lines.find((l) => l.id === id && l.size === size)?.qty ?? 1) - 1}`;
      const box = jar.parentElement!;
      const other = box.querySelector<HTMLElement>(`.mj[data-key="${last}"]`);
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
    window.location.href = `mailto:${root.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  render();
  return { show, hide };
}

const miniJar = (id: string, size: Size, key: string) => {
  const p = product(id);
  return `<button type="button" class="mj mj--${size}" data-key="${key}" aria-label="Retirer un pot ${p.name} ${sizeLabel(size)}">
    <svg viewBox="0 0 40 52"><rect x="5" y="1" width="30" height="9" rx="2.5" fill="#15100c"/>
    <rect x="3" y="9" width="34" height="42" rx="7" fill="url(#mj-${id})"/>
    <ellipse cx="20" cy="31" rx="11.5" ry="9.5" fill="#f4ecdc"/>
    <text x="20" y="33.5" text-anchor="middle" font-family="Pinyon Script, cursive" font-size="7" fill="#2a1f16">${p.name}</text>
    <rect x="7" y="13" width="2.6" height="32" rx="1.3" fill="#fff" opacity=".35"/></svg></button>`;
};

// Pots dessinés dans chaque caisse : on n'anime que ceux qui arrivent ou partent
function renderCrates() {
  const keys: [string, Line][] = [];
  for (const l of lines) for (let n = 0; n < l.qty; n++) keys.push([`${l.id}|${l.size}|${n}`, l]);
  const shown = keys.slice(0, MAX_JARS);
  const extra = keys.length - shown.length;

  $$('[data-crate-jars]').forEach((box) => {
    const existing = new Map($$<HTMLElement>('.mj', box).map((el) => [el.dataset.key!, el]));
    const wanted = new Set(shown.map(([k]) => k));
    existing.forEach((el, k) => {
      if (wanted.has(k)) return;
      el.classList.add('is-leaving');
      el.dataset.key = `gone-${k}`;
      gsap.to(el, { y: -60, opacity: 0, rotate: gsap.utils.random(-30, 30), scale: 0.6, duration: 0.45, ease: 'power2.in', onComplete: () => el.remove() });
    });
    shown.forEach(([k, l], i) => {
      let el = existing.get(k);
      if (!el) {
        box.insertAdjacentHTML('beforeend', miniJar(l.id, l.size, k));
        el = box.lastElementChild as HTMLElement;
        const visible = box.getBoundingClientRect().bottom > 0 && box.getBoundingClientRect().top < innerHeight;
        if (visible)
          gsap.fromTo(
            el,
            { y: -window.innerHeight * 0.45, rotate: gsap.utils.random(-25, 25), opacity: 0 },
            { y: 0, rotate: gsap.utils.random(-5, 5), opacity: 1, duration: 1.1, ease: 'bounce.out' },
          );
        else gsap.set(el, { rotate: gsap.utils.random(-5, 5) });
      }
      el.style.order = String(i);
    });
    box.querySelector('.mj-more')?.remove();
    if (extra > 0) box.insertAdjacentHTML('beforeend', `<span class="mj-more" style="order:${MAX_JARS}">+${extra}</span>`);
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
        <span class="ci-jar" style="--c1:${p.honey[0]};--c2:${p.honey[1]}"><i></i></span>
        <div>
          <p class="ci-name">${p.name} ${p.year}</p>
          <p class="ci-meta">${sizeLabel(l.size)} · ${p.prices[l.size]} € le pot</p>
          <div class="ci-qty">
            <button type="button" data-act="minus" aria-label="Retirer un pot">−</button>
            <span>${l.qty}</span>
            <button type="button" data-act="plus" aria-label="Ajouter un pot">+</button>
          </div>
        </div>
        <div><p class="ci-price">${price(l)}€</p><button type="button" class="ci-rm" data-act="rm">Retirer</button></div>
      </li>`;
    })
    .join('');

  const n = count();
  $$('[data-cart-total]').forEach((el) => (el.textContent = `${total()}€`));
  $$('[data-cart-count]').forEach((el) => (el.textContent = String(n)));
  $$('[data-crate-count]').forEach((el) => (el.textContent = String(n)));
  $$('[data-crate-word]').forEach((el) => (el.textContent = n > 1 ? 'pots' : 'pot'));
  $$<HTMLButtonElement>('[data-crate-send]').forEach((b) => (b.disabled = !has));
  $$('[data-dock-jars]').forEach(
    (el) =>
      (el.innerHTML = lines
        .slice(0, 4)
        .map((l) => `<i style="--c1:${product(l.id).honey[0]};--c2:${product(l.id).honey[1]}"></i>`)
        .join('')),
  );
  renderCrates();
}

export function addToCart(id: string, size: Size, qty = 1) {
  change(id, size, qty);
  $$('[data-cart-count]').forEach((c) => {
    c.classList.remove('bump');
    void c.offsetWidth;
    c.classList.add('bump');
  });
}
