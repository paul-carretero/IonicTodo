/**
 * Représente un contact de la machine.
 * Seule les informations utile à l'application y sont renseignée
 *
 * @export
 * @interface ISimpleContact
 */
export interface ISimpleContact {
  displayName?: string;

  mobile?: string;

  email?: string;

  id?: string;
}
