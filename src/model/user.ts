import { TodoListPath } from './todo-list-path';
import { TodoItemPath } from './todo-item-path';
export interface AppUser {
  /**
   * Ensemble des UUID des listes partagés par d'autre utilisateur avec cet utilisateur
   *
   * @type {string[]}
   * @memberof User
   */
  todoListSharedWithMe: TodoListPath[];

  /**
   * Ensemble des UUID des todos partagés par d'autre utilisateur avec cet utilisateur
   *
   * @type {string[]}
   * @memberof User
   */
  todoItemSharedWithMe: TodoItemPath[];
}
