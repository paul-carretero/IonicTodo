import { ITodoItem } from './todo-item';

/**
 * Représente une liste de tâches
 *
 * @export
 * @interface ITodoList
 */
export interface ITodoList {
  /**
   * Magic string pour identifier cette classe comme une liste de todo
   *
   * @type {string}
   * @memberof ITodoList
   */
  magic?: string;

  /**
   * Identifieur unique de la liste
   *
   * @type {string}
   * @memberof ITodoList
   */
  uuid: string;

  /**
   * Nom de la liste
   *
   * @type {string}
   * @memberof ITodoList
   */
  name: string;

  /**
   * Ensemble des Todo de cette liste
   *
   * @type {ITodoItem[]}
   * @memberof ITodoList
   */
  items: ITodoItem[];

  /**
   * Icone (Cordova) de cette liste
   *
   * @type {string}
   * @memberof ITodoList
   */
  icon: string;

  /**
   * Ordre de la liste par rapport aux autre liste (fonctionement similaire à un z-index)
   *
   * @type {number}
   * @memberof ITodoList
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
