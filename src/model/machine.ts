export interface IMachine {
  notifDate: INotifData[];
}

/**
 * Représente un enregistrement pour l'ensemble des notifications d'un utilisateur
 *
 * @export
 * @interface INotifData
 */
export interface INotifData {
  /**
   * id de la notification
   *
   * @type {number}
   * @memberof INotifData
   */
  idNotif: number;

  /**
   * id tu todo corres
   *
   * @type {string}
   * @memberof INotifData
   */
  todoUuid: string;

  /**
   * Date de notification
   *
   * @type {Date}
   * @memberof INotifData
   */
  dateNotif: Date;
}
