import { ITodoListPath } from './todo-list-path';

/**
 * Représente les donnée stockée pour un utilisateur, principalement les liste qui sont lié avec son compte
 *
 * @export
 * @interface AppUser
 */
export interface IAppUser {
  /**
   * Ensemble des UUID des listes partagés par d'autre utilisateur avec cet utilisateur
   *
   * @type {ITodoListPath[]}
   * @memberof AppUser
   */
  todoListSharedWithMe: ITodoListPath[];

  /**
   * nombre de todo complété par cet utilisateur
   *
   * @type {number}
   * @memberof IAppUser
   */
  todoValide: number;
}
