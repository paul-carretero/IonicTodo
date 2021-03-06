import { DocumentReference } from '@firebase/firestore-types';
import { Media } from './media';
import { MenuRequestType } from './menu-request-type';

/**
 * Représente une action utilisateur sur un menu
 *
 * @export
 * @interface IMenuRequest
 */
export interface IMenuRequest {
  /**
   * Type de la requête utilisateur des menu
   *
   * @required
   * @type {MenuRequestType}
   * @memberof IMenuRequest
   */
  request: MenuRequestType;

  /**
   * optionel, précise le type de media, par exemple pour l'envoie de liste
   *
   * @type {Media}
   * @memberof IMenuRequest
   */
  media?: Media | null;

  /**
   * identifiant d'une ressource
   *
   * @type {string}
   * @memberof IMenuRequest
   */
  uuid?: string | null;

  /**
   * référence vers un todo
   *
   * @type {(DocumentReference | null)}
   * @memberof IMenuRequest
   */
  ref?: DocumentReference | null;
}
