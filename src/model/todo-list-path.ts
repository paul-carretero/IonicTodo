/**
 * Représente un chemin vers une liste de todo, notament pour partager des listes (par référence ou par valeur)
 *
 * @export
 * @interface ITodoListPath
 */
export interface ITodoListPath {
  /**
   * Identifiant unique de l'utilisateur ayant créer le todo
   *
   * @type {string}
   * @memberof ITodoListPath
   */
  userUUID: string | null;

  /**
   * Identifiant unique de la liste
   *
   * @type {string}
   * @memberof ITodoListPath
   */
  listUUID: string | null;

  /**
   * true si la liste doit être importé par référence (lien), false si l'on doit la cloner
   *
   * @type {boolean}
   * @memberof ITodoListPath
   */
  shareByReference: boolean;

  /**
   * Défini si la liste doit être verrouillé en modification (ie insertion/suppression de todo et nom de liste)
   *
   * @type {boolean}
   * @memberof ITodoListPath
   */
  locked?: boolean;
}
