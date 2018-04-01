/**
 * Représente une demande de navigation interne de l'application
 * Des données peuvent optionellement y être ajoutée
 *
 * @export
 * @interface INavRequest
 */
export interface INavRequest {
  /**
   * page vers laquelle on doit naviguer
   *
   * @type {string}
   * @memberof INavRequest
   */
  page: string;

  /**
   * données à passer en argument à la page
   *
   * @type {*}
   * @memberof INavRequest
   */
  data?: any;
}
