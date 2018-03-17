import { IAuthor } from './author';
import { ITodoListPath } from './todo-list-path';

/**
 * Permet d'exporter une liste sur le cloud et de la récupérer avec un mot de passe
 *
 * @export
 * @interface CloudSharedList
 */
export interface ICloudSharedList {
  /**
   * Lien vers la liste exportée
   *
   * @type {ITodoListPath}
   * @memberof ICloudSharedList
   */
  list: ITodoListPath;

  /**
   * Mot de passe protégeant cette liste
   *
   * @type {string}
   * @memberof ICloudSharedList
   */
  password?: string;

  /**
   * email du compte cible pour partage
   *
   * @type {string}
   * @memberof ICloudSharedList
   */
  email?: string;

  /**
   * Si vrai alors il s'agit d'une tentative de partage par shake (non sécurisé)
   * Ce type de partage se base sur le fait que deux téléphone sont secouer avec
   * un timestamp proche et une position proche
   *
   * @type {boolean}
   * @memberof ICloudSharedList
   */
  shakeToShare: boolean;

  /**
   * Author de ce partage
   *
   * @type {IAuthor}
   * @memberof ICloudSharedList
   */
  author: IAuthor;

  /**
   * Le nom de la liste for the sake of performance
   *
   * @type {string}
   * @memberof ICloudSharedList
   */
  name: string;
}
