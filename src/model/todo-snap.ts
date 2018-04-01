import { ITodoItem } from './todo-item';

/**
 * représente les informations pour une snapshot de todo
 *
 * @export
 * @interface ITodoSnapshot
 * @extends {ITodoItem}
 */
export interface ITodoSnapshot extends ITodoItem {
  /**
   * ensemble des listes référencant ce todo
   *
   * @type {string[]}
   * @memberof ITodoSnapshot
   */
  listUuids?: string[];
}
