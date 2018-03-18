import { DocumentReference } from '@firebase/firestore-types';

import { IAuthor } from './author';

/**
 * Représente une liste de tâches
 *
 * @export
 * @interface ITodoList
 */
export interface ITodoList {
  /**
   * Identifieur unique de la liste
   *
   * @type {string}
   * @memberof ITodoList
   */
  uuid: string | null;

  /**
   * Nom de la liste
   *
   * @type {string}
   * @memberof ITodoList
   */
  name: string | null;

  /**
   * Ensemble des Todo de cette liste
   *
   * @type {DocumentReference}
   * @memberof ITodoList
   */
  externTodos: DocumentReference[];

  /**
   * Icone (Cordova) de cette liste
   *
   * @type {string}
   * @memberof ITodoList
   */
  icon: string | null;

  /**
   * Ordre de la liste par rapport aux autre liste (fonctionement similaire à un z-index)
   *
   * @type {number}
   * @memberof ITodoList
   */
  order: number | null;

  /**
   * Autheur de cette liste
   *
   * @type {IAuthor}
   * @memberof ITodoList
   */
  author: IAuthor | null;
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
