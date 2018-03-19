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
   * Vrai si l'on doit envoyer une notification (native) avant que le todo n'arrive à la deadline
   *
   * @type {boolean}
   * @memberof TodoItem
   */
  notif: boolean;

  /**
   * Vrai si l'on doit envoyer un SMS lorsque la tâche est réalisée
   *
   * @type {boolean}
   * @memberof TodoItem
   */
  SMSOnDone: boolean;

  /**
   * Vrai si l'on doit envoyer un SMS en même temps que la notification de deadline
   *
   * @type {boolean}
   * @memberof ITodoItem
   */
  SMSBeforeDeadline: boolean;

  /**
   * SMS auquel envoyer les notifications
   *
   * @type {{string | null}}
   * @memberof ITodoItem
   */
  SMSNumber: string | null;

  /**
   * image en base64 de l'image
   *
   * @type {(string | null)}
   * @memberof ITodoItem
   */
  picture: string | null;

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
