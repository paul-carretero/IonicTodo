/**
 * Représente un chemin vers une liste de todo, notament pour partager des listes par référence
 *
 * @export
 * @interface TodoListPath
 */
export interface TodoListPath {
  /**
   * Identifiant unique de l'utilisateur ayant créer le todo
   *
   * @type {string}
   * @memberof TodoListPath
   */
  userUUID: string;

  /**
   * Identifiant unique de la liste
   *
   * @type {string}
   * @memberof TodoListPath
   */
  listUUID: string;
}
