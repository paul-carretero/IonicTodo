export interface IAuthor {
  /**
   * Nom de l'autheur
   *
   * @type {string}
   * @memberof IAuthor
   */
  displayName?: string;

  /**
   * Email de l'autheur
   *
   * @type {string}
   * @memberof IAuthor
   */
  email?: string;

  /**
   * Identifiant unique de l'autheur
   *
   * @type {string}
   * @memberof IAuthor
   */
  uuid?: string;

  /**
   * Date à laquelle l'autheur à créer l'objet
   *
   * @type {Date}
   * @memberof IAuthor
   */
  date?: Date;

  /**
   * ville à laquelle l'objet à été créé
   *
   * @type {string}
   * @memberof IAuthor
   */
  city?: string;
}
