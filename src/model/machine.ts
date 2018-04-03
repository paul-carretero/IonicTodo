import { IPlanifiedSms } from './planified-sms';

/**
 * représente les données d'une machine
 *
 * @export
 * @interface IMachine
 */
export interface IMachine {
  /**
   * sms plannifié qu'une machine à prévu d'envoyer
   *
   * @type {IPlanifiedSms[]}
   * @memberof IAppUser
   */
  planifiedSmsList: IPlanifiedSms[];
}
