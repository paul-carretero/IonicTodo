export interface Settings {
  /**
   * True : l'application reconnectera le dernier utilisateur (par défault...)
   * False : l'application déconnectera l'utilisateur automatiquement lors de sa fermeture/ouverture
   *
   * @type {boolean}
   * @memberof Settings
   */
  autoLogIn: boolean;

  /**
   * True : les alert seront synthétiser vocalement
   * False : par défault : les alert ne seront pas lus
   *
   * @type {boolean}
   * @memberof Settings
   */
  autoReadAlert: boolean;
}
