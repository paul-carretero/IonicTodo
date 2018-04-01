/**
 * Représente un contact de la machine.
 * Seule les informations utile à l'application y sont renseignée
 *
 * @export
 * @interface ISimpleContact
 */
export interface ISimpleContact {
  /**
   * Id pseudo unique de ce contact
   *
   * @type {number}
   * @memberof ISimpleContact
   */
  id: number;

  /**
   * nom de ce contact
   *
   * @type {(string | null)}
   * @memberof ISimpleContact
   */
  displayName: string | null;

  /**
   * numéro de tél mobile de ce contact
   *
   * @type {(string | null)}
   * @memberof ISimpleContact
   */
  mobile: string | null;

  /**
   * email de ce contact
   *
   * @type {(string | null)}
   * @memberof ISimpleContact
   */
  email: string | null;
}
