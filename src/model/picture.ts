/**
 * représente une image sur le firestore
 *
 * @export
 * @interface IPicture
 */
export interface IPicture {
  /**
   * identifiant unique de l'image
   *
   * @type {string}
   * @memberof IPicture
   */
  uuid: string;

  /**
   * pourcentage de chargement de l'image
   *
   * @type {number}
   * @memberof IPicture
   */
  dl: number;

  /**
   * url de l'image. Les urls firestore ne se "périme" pas
   *
   * @type {string}
   * @memberof IPicture
   */
  url: string | null;
}
