/**
 * représente des informations sur les réalisation d'une liste
 *
 * @export
 * @interface IListMetadata
 */
export interface IListMetadata {
  /**
   * nombre total de todo pour cette liste
   *
   * @type {number}
   * @memberof IListMetadata
   */
  todoTotal: number;

  /**
   * nombre de todo complété pour cette liste
   *
   * @type {number}
   * @memberof IListMetadata
   */
  todoComplete: number;

  /**
   * true si au moins un todo est en retard par rapport à sa deadline
   *
   * @type {boolean}
   * @memberof IListMetadata
   */
  atLeastOneLate: boolean;
}
