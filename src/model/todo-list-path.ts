/**
 * Représente un chemin vers une liste de todo, notament pour partager des listes par référence
 *
 * @export
 * @interface ITodoListPath
 */
export interface ITodoListPath {
  /**
   * Magic string pour identifier cette classe comme un lien vers une liste
   *
   * @type {string}
   * @memberof ITodoListPath
   */
  magic?: string;

  /**
   * Identifiant unique de l'utilisateur ayant créer le todo
   *
   * @type {string}
   * @memberof ITodoListPath
   */
  userUUID: string;

  /**
   * Identifiant unique de la liste
   *
   * @type {string}
   * @memberof ITodoListPath
   */
  listUUID: string;
}
