// Routeur de l'aperçu autonome (un seul fichier HTML) : rejoue les événements
// du ClientRouter d'Astro pour réutiliser les transitions et l'initialisation de main.ts.
import './main';

type Page = { title: string; label: string; main: string };
const pages: Record<string, Page> = JSON.parse(document.getElementById('pages')!.textContent!);
const assets: Record<string, string> = JSON.parse(document.getElementById('assets')!.textContent!);
const w = window as { __previewPath?: string };

const inline = (html: string) => html.replace(/\/(?:img|brand|fonts)\/[^"')\s]+|\/favicon\.svg/g, (m) => assets[m] ?? m);
const norm = (p: string) => p.replace(/\/$/, '') || '/';
const main = document.querySelector<HTMLElement>('[data-page]')!;

async function go(path: string, source?: Element, push = true) {
  const page = pages[norm(path)] ?? pages['/404'];
  const ev = Object.assign(new Event('astro:before-preparation'), { loader: async () => {}, sourceElement: source });
  document.dispatchEvent(ev);
  await ev.loader();
  document.dispatchEvent(new Event('astro:before-swap'));
  main.innerHTML = inline(page.main);
  document.title = page.title;
  w.__previewPath = norm(path);
  if (push) try { history.pushState({ path }, '', '#' + path); } catch { /* bac à sable */ }
  document.dispatchEvent(new Event('astro:after-swap'));
  document.dispatchEvent(new Event('astro:page-load'));
}

document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest('a');
  const href = a?.getAttribute('href');
  if (!a || !href || !href.startsWith('/') || a.hasAttribute('download') || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  if (norm(href) !== w.__previewPath) go(href, a);
});
window.addEventListener('popstate', (e) => go((e.state as { path?: string })?.path ?? '/', undefined, false));

// Première page : celle du hash si présente, sinon l'accueil (déjà dans le HTML)
const start = location.hash.startsWith('#/') ? norm(location.hash.slice(1)) : '/';
w.__previewPath = start;
if (start !== '/' && pages[start]) {
  main.innerHTML = inline(pages[start].main);
  document.title = pages[start].title;
}
document.dispatchEvent(new Event('astro:page-load'));
