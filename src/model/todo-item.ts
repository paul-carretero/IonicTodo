import { IAuthor } from './author';
import { ILatLng } from '@ionic-native/google-maps';
export interface ITodoItem {
  /**
   * Identifieur unique du todo
   *
   * @type {string}
   * @memberof TodoItem
   */
  uuid?: string;

  /**
   * Nom du todo
   *
   * @type {string}
   * @memberof TodoItem
   */
  name: string;

  /**
   * Description détaillé du todo
   *
   * @type {string}
   * @memberof TodoItem
   */
  desc?: string;

  /**
   * Vrai si l'on doit envoyer une notification (native) avant que le todo n'arrive à la deadline
   *
   * @type {boolean}
   * @memberof TodoItem
   */
  notif?: boolean;

  /**
   * Vrai si l'on doit envoyer un SMS lorsque la tâche est réalisée
   *
   * @type {boolean}
   * @memberof TodoItem
   */
  SMSOnDone?: boolean;

  /**
   * Vrai si l'on doit envoyer un SMS en même temps que la notification de deadline
   *
   * @type {boolean}
   * @memberof TodoItem
   */
  SMSBeforeDeadline?: boolean;

  /**
   * SMS auquel envoyer les notifications
   *
   * @type {string}
   * @memberof ITodoItem
   */
  SMSNumber?: string;

  // emplacement du todo
  posCreated?: ILatLng;
  posCompleted?: ILatLng;

  // image en base64 du todo
  picture?: string;

  // enregistrement audio
  mediaLocation?: string;

  // date de complétion
  complete?: boolean;
  dateCompleted?: string;
  deadline?: Date;

  author?: IAuthor;
}
