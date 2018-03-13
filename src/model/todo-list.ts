import { Global } from './../shared/global';
import { TodoItem } from './todo-item';

/**
 * Représente une liste de tâches
 *
 * @export
 * @interface TodoList
 */
export interface TodoList {
  /**
   * Magic string pour identifier cette classe comme une liste de todo
   *
   * @type {string}
   * @memberof TodoList
   */
  magic?: string;

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
   * Ordre de la liste par rapport aux autre liste (fonctionement similaire à un z-index)
   *
   * @type {number}
   * @memberof TodoList
   */
  order?: number;
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
