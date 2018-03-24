import { IPicture } from './picture';
import { ISimpleContact } from './simple-contact';
import { DocumentReference } from '@firebase/firestore-types';
import { IAuthor } from './author';
export interface ITodoItem {
  /**
   * Identifieur unique du todo
   *
   * @type {string}
   * @memberof TodoItem
   */
  uuid: string | null;

  /**
   * Reference vers ce document;
   * Défini à la création puis readonly...
   *
   * @type {(DocumentReference | null)}
   * @memberof ITodoItem
   */
  ref: DocumentReference | null;

  /**
   * Nom du todo
   *
   * @type {string}
   * @memberof TodoItem
   */
  name: string | null;

  /**
   * Description détaillé du todo
   *
   * @type {(string | null)}
   * @memberof ITodoItem
   */
  desc: string | null;

  /**
   * contient optionelement une date à laquelle envoyer une notification
   *
   * @type {{Date | null}}
   * @memberof TodoItem
   */
  notif: Date | null;

  /**
   * contact auquel il faut envoyer un sms lors de la complétion de la tâche
   *
   * @type {string}
   * @memberof ITodoItem
   */
  contacts: ISimpleContact[];

  /**
   * data des images de ce todo sur firebase storage
   *
   * @type {IPicture[]}
   * @memberof ITodoItem
   */
  pictures: IPicture[];

  /**
   * true si le todo est complété, false sinon
   *
   * @type {boolean}
   * @memberof ITodoItem
   */
  complete: boolean;

  /**
   * Deadline optionelle du todo, passé cette date il sera considéré comme en retard si pas complété
   *
   * @type {(Date | null)}
   * @memberof ITodoItem
   */
  deadline: Date | null;

  /**
   * addresse optionelle ou le todo doit être fait
   *
   * @type {(string | null)}
   * @memberof ITodoItem
   */
  address: string | null;

  /**
   * Défini l'ordre d'affichage des todo dans une liste (ssi ils appartiennent à cette liste)
   *
   * @type {number}
   * @memberof ITodoItem
   */
  order: number;

  /**
   * Signature de création du todo
   *
   * @type {(IAuthor | null)}
   * @memberof ITodoItem
   */
  author: IAuthor | null;

  /**
   * signature de complétion
   *
   * @type {(IAuthor | null)}
   * @memberof ITodoItem
   */
  completeAuthor: IAuthor | null;
}
