// Fichier SVG autonome du logo : /brand/sadik.svg
import type { APIRoute } from 'astro';
import { sadikSvg } from '../../brand/sadik';

export const GET: APIRoute = () =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${sadikSvg()}\n`, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
