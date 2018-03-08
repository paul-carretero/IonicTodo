import { TodoItem } from './todo-item';

export interface TodoList {
  /**
   * Identifieur unique de la liste
   *
   * @type {string}
   * @memberof TodoList
   */
  uuid: string;

  /**
   * Nom de la liste
   *
   * @type {string}
   * @memberof TodoList
   */
  name: string;

  /**
   * Ensemble des Todo de cette liste
   *
   * @type {TodoItem[]}
   * @memberof TodoList
   */
  items: TodoItem[];

  /**
   * Icone (Cordova) de cette liste
   *
   * @type {string}
   * @memberof TodoList
   */
  icon?: string;
}
