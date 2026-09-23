// Mini-routeur pour l'aperçu en page unique (artefact) : rejoue les événements
// du ClientRouter d'Astro pour que app.ts fonctionne sans modification.
import './app';

type Page = { title: string; header: string; main: string };
const pages: Record<string, Page> = JSON.parse(document.getElementById('pages')!.textContent!);
let current = '/';

const toPath = (href: string) =>
  new URL(href, `https://site${current}`).pathname.replace(/\/$/, '') || '/';
// Ancre simple (#about, #projet-un) <-> chemin
const toToken = (path: string) => (path === '/' ? '' : path.split('/').pop()!);
const fromToken = (token: string) =>
  Object.keys(pages).find((p) => p !== '/' && toToken(p) === token) ?? '/';

function render(path: string) {
  const page = pages[path] ?? pages['/404'];
  document.querySelector('header.header')!.outerHTML = page.header;
  document.querySelector('main')!.innerHTML = page.main;
  document.title = page.title;
  current = path;
  try {
    history.replaceState(null, '', toToken(path) ? `#${toToken(path)}` : location.pathname);
  } catch {}
}

async function navigate(path: string) {
  if (path === current) return;
  const prep = Object.assign(new Event('astro:before-preparation'), {
    loader: async () => {},
  });
  document.dispatchEvent(prep);
  await prep.loader();
  document.dispatchEvent(new Event('astro:before-swap'));
  render(path);
  window.scrollTo(0, 0);
  document.dispatchEvent(new Event('astro:after-swap'));
  document.dispatchEvent(new Event('astro:page-load'));
}

document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.('a[href]');
  const href = a?.getAttribute('href');
  if (!href?.startsWith('/') || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  navigate(toPath(href));
});

const start = fromToken(location.hash.slice(1));
if (start !== '/') render(start);
document.dispatchEvent(new Event('astro:page-load'));
