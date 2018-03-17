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
   * Utilisé pour récupérer un timestamp serveur de la part d'un utilisateur connecté
   *
   * @type {Date}
   * @memberof IAppUser
   */
  timestamp?: Date;
}
