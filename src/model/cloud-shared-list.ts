import * as firebase from 'firebase';

import { ITodoListPath } from './todo-list-path';

/**
 * Permet d'exporter une liste sur le cloud et de la récupérer avec un mot de passe
 *
 * @export
 * @interface CloudSharedList
 */
export interface ICloudSharedList {
  /**
   * Lien vers la liste exportée
   *
   * @type {ITodoListPath}
   * @memberof ICloudSharedList
   */
  list: ITodoListPath;

  /**
   * Mot de passe protégeant cette liste
   *
   * @type {string}
   * @memberof ICloudSharedList
   */
  password?: string;

  /**
   * email du compte cible pour partage
   *
   * @type {string}
   * @memberof ICloudSharedList
   */
  email?: string;

  /**
   * Timestamp ou le partage a été initié
   *
   * @type {*}
   * @memberof ICloudSharedList
   */
  timestamp?: any;

  /**
   * coordonnée ou le partage à été effectué
   *
   * @type {firebase.firestore.GeoPoint}
   * @memberof ICloudSharedList
   */
  coord?: firebase.firestore.GeoPoint;

  /**
   * Si vrai alors il s'agit d'une tentative de partage par shake (non sécurisé)
   * Ce type de partage se base sur le fait que deux téléphone sont secouer avec
   * un timestamp proche et une position proche
   *
   * @type {boolean}
   * @memberof ICloudSharedList
   */
  shakeToShare: boolean;

  /**
   * identifiant unique du créateur de ce partage
   *
   * @type {string}
   * @memberof ICloudSharedList
   */
  authorUuid: string;
}
