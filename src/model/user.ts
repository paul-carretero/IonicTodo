import { TodoListPath } from './todo-list-path';

/**
 * Représente les donnée stockée pour un utilisateur, principalement les liste qui sont lié avec son compte
 *
 * @export
 * @interface AppUser
 */
export interface AppUser {
  /**
   * Ensemble des UUID des listes partagés par d'autre utilisateur avec cet utilisateur
   *
   * @type {TodoListPath[]}
   * @memberof AppUser
   */
  todoListSharedWithMe: TodoListPath[];
}
