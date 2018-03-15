import { ILatLng } from '@ionic-native/google-maps';
import { ITodoListPath } from './todo-list-path';
import { ITodoList } from './todo-list';
import { FieldValue } from '@firebase/firestore-types';

/**
 * Permet d'exporter une liste sur le cloud et de la récupérer avec un mot de passe
 *
 * @export
 * @interface CloudSharedList
 */
export interface ICloudSharedList {
  list: ITodoList | ITodoListPath;

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
   * @type {FieldValue}
   * @memberof ICloudSharedList
   */
  timestamp?: FieldValue;

  /**
   * coordonnée ou le partage à été effectué
   *
   * @type {ILatLng}
   * @memberof ICloudSharedList
   */
  coord?: ILatLng;

  /**
   * Si vrai alors il s'agit d'une tentative de partage par shake (non sécurisé)
   * Ce type de partage se base sur le fait que deux téléphone sont secouer avec
   * un timestamp proche et une position proche
   *
   * @type {boolean}
   * @memberof ICloudSharedList
   */
  shareWithShake?: boolean;
}
