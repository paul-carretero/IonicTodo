import { TodoListPath } from './todo-list-path';

/**
 *  Représente un chemin vers un todo, notament pour partager des todos par référence
 *
 * @export
 * @interface TodoItemPath
 * @extends {TodoListPath}
 */
export interface TodoItemPath extends TodoListPath {
  /**
   * identifiant unique du Todo
   *
   * @type {string}
   * @memberof TodoItemPath
   */
  todoUUID: string;
}
