/**
 * Représente une demande de navigation interne de l'application
 * Des données peuvent optionellement y être ajoutée
 *
 * @export
 * @interface INavRequest
 */
export interface INavRequest {
  page: string;
  data?: any;
}
