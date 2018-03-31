/**
 * options d'initialisation pour l'application,
 * Défini notament la langue des mois et évite que le clavier déclanche du padding inutile...
 */
export const appOpts = {
  monthNames: [
    'Janvier',
    'Fevrier',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Aout',
    'Septembre',
    'Octobre',
    'Novembre',
    'Decembre'
  ],
  monthShortNames: [
    'jan',
    'fev',
    'mar',
    'avr',
    'mai',
    'jun',
    'jui',
    'aou',
    'sep',
    'oct',
    'nov',
    'dec'
  ],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayShortNames: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
  scrollAssist: true,
  scrollPadding: false,
  autoFocusAssist: false
};
