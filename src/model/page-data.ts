/**
 * Représente les spécificité d'une page.
 * Notament utilisé pour affiché un header correct
 *
 * @export
 * @interface IPageData
 */
export interface IPageData {
  /**
   * titre de la page
   *
   * @type {string}
   * @memberof IPageData
   */
  title: string;

  /**
   * true si l'on doit afficher un check pour valider
   *
   * @type {boolean}
   * @memberof IPageData
   */
  validable: boolean;

  /**
   * true si le sous menu doit permettre d'éditer la page
   *
   * @type {boolean}
   * @memberof IPageData
   */
  editable: boolean;

  /**
   * true si le sous menu doit pemerttre de partager la page via des media spécifiés
   *
   * @type {boolean}
   * @memberof IPageData
   */
  shareable: boolean;

  /**
   * true si la liste est importable
   *
   * @type {boolean}
   * @memberof IPageData
   */
  importable: boolean;

  /**
   * true si l'on doit afficher la loupe pour rechercher
   *
   * @type {boolean}
   * @memberof IPageData
   */
  searchable: boolean;

  /**
   * sous titre de la page
   *
   * @type {string}
   * @memberof IPageData
   */
  subtitle: string;

  /**
   * placeholder de la barre de recherche
   *
   * @type {string}
   * @memberof IPageData
   */
  searchPlaceholders: string;

  /**
   * true si la page est copiable (sous menu)
   *
   * @type {boolean}
   * @memberof IPageData
   */
  copiable: boolean;

  /**
   * true si le sous menu doit donner la possibilité de coller (si possible)
   *
   * @type {boolean}
   * @memberof IPageData
   */
  pastable: boolean;

  /**
   * true si il s'agit d'une page affichant une liste
   *
   * @type {boolean}
   * @memberof IPageData
   */
  isList: boolean;
}
