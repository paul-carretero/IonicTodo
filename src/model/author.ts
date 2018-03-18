/**
 * Représente une 'signature' d'un objet.
 * Une signature contient notament l'autheur et la date et le lieu de création d'un objet
 *
 * @export
 * @interface IAuthor
 */
export interface IAuthor {
  /**
   * Nom de l'autheur
   *
   * @type {string}
   * @memberof IAuthor
   */
  displayName: string | null;

  /**
   * Email de l'autheur
   *
   * @type {string}
   * @memberof IAuthor
   */
  email: string | null;

  /**
   * Identifiant unique de l'autheur
   *
   * @type {string}
   * @memberof IAuthor
   */
  uuid: string | null;

  /**
   * Date à laquelle l'autheur à créer l'objet
   *
   * @type {Date}
   * @memberof IAuthor
   */
  timestamp: Date | null;

  /**
   * ville à laquelle l'objet à été créé
   *
   * @type {string}
   * @memberof IAuthor
   */
  city: string | null;

  /**
   * Position plus précise où à été réalisé l'objet
   *
   * @type {firebase.firestore.GeoPoint}
   * @memberof IAuthor
   */
  coord: firebase.firestore.GeoPoint | null;
}
