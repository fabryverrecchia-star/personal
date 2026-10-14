/* ==========================================================================
   Les infos du baptême — c'est le seul fichier à modifier pour changer
   un horaire, une adresse ou un texte. Une ligne laissée vide ("") n'est
   simplement pas affichée sur la page.
   ========================================================================== */
window.LOU = {
  prenom: "Lou",
  date: "2026-10-31",                       // AAAA-MM-JJ

  ceremonie: {
    heure: "",                              // ex. "10h30"
    lieu: "",                               // ex. "Église Saint-Amable"
    adresse: "",                            // ex. "Rue Saint-Amable, 63200 Riom"
    note: ""                                // ex. "Merci d'arriver quelques minutes en avance"
  },

  repas: {
    heure: "",                              // ex. "12h30"
    lieu: "Augustine Bistronomie 1890",
    adresse: "1 Place des Martyrs de la Résistance, 63200 Riom",
    note: "Un repas convivial pour prolonger la fête, tous ensemble."
  },

  // Signature en bas de la page, ex. "Avec tout notre amour, Marie & Thomas"
  signature: "Avec tout notre amour"
};
