/* ==========================================================================
   Les infos du baptême — c'est le seul fichier à modifier pour changer
   un horaire, une adresse ou un texte. Une ligne laissée vide ("") n'est
   simplement pas affichée sur la page.
   ========================================================================== */
window.LOU = {
  prenom: "Lou",
  date: "2026-10-31",                       // AAAA-MM-JJ

  ceremonie: {
    heure: "11h",                           // ex. "10h30"
    lieu: "Église de la Nativité-de-Saint-Jean-Baptiste",
    adresse: "63780 Saint-Georges-de-Mons",
    note: ""                                // ex. "Merci d'arriver quelques minutes en avance"
  },

  repas: {
    heure: "12h30 – 13h",                   // ex. "12h30"
    lieu: "Augustine Bistronomie 1890",
    adresse: "1 Place des Martyrs de la Résistance, 63200 Riom",
    note: "Un repas convivial pour prolonger la fête, tous ensemble."
  },

  // Signature en bas de la page, ex. "Avec tout notre amour, Marie & Thomas"
  signature: "Avec tout notre amour",

  // Après le baptême, la page devient une page de remerciements avec les photos.
  //   mode: "auto"  → bascule toute seule le lendemain de la date ci-dessus
  //   mode: "avant" → garde le programme · mode: "apres" → remerciements tout de suite
  mode: "auto",

  merci: {
    titre: "Merci",
    sousTitre: "d'avoir partagé ce jour avec nous",
    texte: "Merci à chacun d'entre vous d'avoir été là pour le baptême de Lou : pour vos sourires, vos mots doux et vos attentions. Grâce à vous, cette journée restera gravée dans nos cœurs. Voici les souvenirs de cette belle journée, à regarder, à télécharger et à garder.",
  },

  // Le nom du photographe, affiché avec ses photos (laisser "" pour ne rien afficher)
  photographe: "",

  // Le dossier Google Drive du reportage (bouton « Ouvrir sur Google Drive » à côté du ZIP ; "" pour le cacher)
  driveReportage: "https://drive.google.com/drive/folders/1DpooIZ6oDE1fM5e6g4fzLTgNybnITZSp?usp=sharing",

  // Les photos qui défilent en boucle sur l'accueil, derrière « Merci », dans cet ordre
  // (noms des fichiers du photographe, sans « .jpg »). Vide [] → les photos étoilées dans
  // l'espace privé, sinon une dizaine choisies automatiquement.
  accueilPhotos: ["878A7189", "878A7185", "878A7179", "878A7176", "878A7172", "878A7169"]
};
