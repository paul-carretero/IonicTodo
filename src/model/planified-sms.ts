import { ISimpleContact } from './simple-contact';
/**
 * Interface fournissant une entrée de sms plannifié
 *
 * @export
 * @interface planifiedSms
 */
export interface IPlanifiedSms {
  /**
   * contacts auquels envoyer le sms
   *
   * @type {ISimpleContact}
   * @memberof IPlanifiedSms
   */
  contacts: ISimpleContact[];

  /**
   * date prévu pour l'envoie
   *
   * @type {Date}
   * @memberof IPlanifiedSms
   */
  date: Date;

  /**
   * uuid unique de cet envoi
   *
   * @type {string}
   * @memberof IPlanifiedSms
   */
  smsUuid: string;

  /**
   * corps du sms
   *
   * @type {string}
   * @memberof IPlanifiedSms
   */
  message: string;

  /**
   * date en format lisible (optionnel)
   *
   * @type {string}
   * @memberof IPlanifiedSms
   */
  dateStr?: string;
}
