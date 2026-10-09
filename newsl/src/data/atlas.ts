// Étapes du voyage « Sounds like … » : du Triangle d'or au monde.
// span = étendue visible (degrés de longitude) sur la plus petite dimension de l'écran.

export interface AtlasStage {
  lon: number;
  lat: number;
  span: number;
  /** Repères dont le nom s'affiche à cette étape */
  markers: string[];
}

export interface AtlasMarker {
  id: string;
  name: string;
  lon: number;
  lat: number;
}

export const markers: AtlasMarker[] = [
  { id: 'crillon', name: 'Le Crillon', lon: 2.3213, lat: 48.8676 },
  { id: 'maxims', name: "Maxim's", lon: 2.3226, lat: 48.8673 },
  { id: 'montaigne', name: 'Avenue Montaigne', lon: 2.3045, lat: 48.8664 },
  { id: 'georgev', name: 'Avenue George V', lon: 2.3006, lat: 48.8687 },
  { id: 'champs', name: 'Champs-Élysées', lon: 2.3076, lat: 48.8698 },
  { id: 'paris', name: 'Paris', lon: 2.3522, lat: 48.8566 },
  { id: 'cernay', name: 'Vaux-de-Cernay', lon: 1.9336, lat: 48.6829 },
  { id: 'courchevel', name: 'Courchevel', lon: 6.6342, lat: 45.4154 },
  { id: 'sttropez', name: 'Saint-Tropez', lon: 6.6406, lat: 43.2727 },
  { id: 'milan', name: 'Milano', lon: 9.19, lat: 45.4642 },
  { id: 'sicile', name: 'Taormina', lon: 15.2853, lat: 37.8516 },
  { id: 'mykonos', name: 'Mykonos', lon: 25.3289, lat: 37.4467 },
  { id: 'dubai', name: 'Dubai', lon: 55.2708, lat: 25.2048 },
  { id: 'newyork', name: 'New York', lon: -74.006, lat: 40.7128 },
];

export const stages: AtlasStage[] = [
  { lon: 2.3105, lat: 48.8682, span: 0.032, markers: ['crillon', 'maxims', 'montaigne', 'georgev', 'champs'] },
  { lon: 2.334, lat: 48.862, span: 0.2, markers: ['paris'] },
  { lon: 4.6, lat: 45.6, span: 7.5, markers: ['sttropez', 'courchevel', 'cernay'] },
  { lon: 9.4, lat: 44.2, span: 9, markers: ['milan'] },
  { lon: 13.2, lat: 40.2, span: 15, markers: ['sicile'] },
  { lon: 18.5, lat: 40.5, span: 24, markers: ['mykonos'] },
  { lon: 34, lat: 34, span: 46, markers: ['dubai'] },
  { lon: -18, lat: 36, span: 120, markers: ['newyork'] },
  { lon: 8, lat: 28, span: 260, markers: [] },
];
