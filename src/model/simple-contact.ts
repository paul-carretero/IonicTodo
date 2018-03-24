/**
 * Représente un contact de la machine.
 * Seule les informations utile à l'application y sont renseignée
 *
 * @export
 * @interface ISimpleContact
 */
export interface ISimpleContact {
  id: string | null;

  machineId: string | null;

  displayName: string | null;

  mobile: string | null;

  email: string | null;
}
