import { IAuthor } from './author';
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

  /**
   * permet de signer les images
   *
   * @type {(IAuthor | null)}
   * @memberof IPicture
   */
  author: IAuthor | null;

  /**
   * nom de l'image
   *
   * @type {(string|null)}
   * @memberof IPicture
   */
  name: string | null;
}
