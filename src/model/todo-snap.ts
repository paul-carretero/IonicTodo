import { ITodoItem } from './todo-item';
export interface ITodoSnapshot extends ITodoItem {
  /**
   * ensemble des listes référencant ce todo
   *
   * @type {string[]}
   * @memberof ITodoSnapshot
   */
  listUuids?: string[];
}
