import { TodoItem } from './todo-item';

/**
 * Représente une liste de tâches
 *
 * @export
 * @interface TodoList
 */
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
  icon: string;

  /**
   * Défini si la liste est privée (permet d'annuler un partage)
   *
   * @type {boolean}
   * @memberof TodoList
   */
  isPrivate: boolean;
}

/**
 * Défini le type d'une liste par rapport à l'utilisateur connecté courrant
 *
 * @export
 * @enum {number}
 */
export enum ListType {
  /**
   * Cette liste est liée au compte utilisateur
   */
  PRIVATE,
  /**
   * Cette liste est liée à la machine
   */
  LOCAL,
  /**
   * Cette liste est partagé avec cet utilisateur
   */
  SHARED
}
