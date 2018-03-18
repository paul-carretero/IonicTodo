import { ILatLng } from '@ionic-native/google-maps';

import { ITodoList } from '../model/todo-list';
import { ITodoListPath } from '../model/todo-list-path';
import { ICloudSharedList } from './../model/cloud-shared-list';
import { IPageData } from './../model/page-data';
import * as firebase from 'firebase';
import { ITodoItem } from '../model/todo-item';

/**
 * Contient des structure de données constante (ou semi constante)
 * pouvent être réutilisée par les composant de l'application
 *
 * @export
 * @class Global
 */
export class Global {
  /**************************************************************************/
  /***************************** PAGES INDEXES ******************************/
  /**************************************************************************/

  /**
   * Index de la page d'accueil
   *
   * @readonly
   * @static
   * @type {number}
   * @memberof Global
   */
  public static readonly HOMEPAGE: number = 0;

  /**
   * Index de la page d'authentification
   * @readonly
   * @static
   * @type {number}
   * @memberof Global
   */
  public static readonly AUTHPAGE: number = 1;

  /**
   * Index de la page d'options
   *
   * @readonly
   * @static
   * @type {number}
   * @memberof Global
   */
  public static readonly OPTSPAGE: number = 2;

  /**************************************************************************/
  /**************************** DEFAULT HEADER ******************************/
  /**************************************************************************/

  /**
   * Page non éditable, non partageable et non validable
   *
   * @static
   * @returns {IPageData}
   * @memberof Global
   */
  public static getDefaultPageData(): IPageData {
    return {
      title: '',
      subtitle: '',
      shareable: false,
      editable: false,
      validable: false,
      searchable: false,
      importable: false,
      searchPlaceholders: 'Rechercher'
    };
  }

  /**
   * Page non éditable, non partageable et validable
   *
   * @static
   * @returns {IPageData}
   * @memberof Global
   */
  public static getValidablePageData(): IPageData {
    return {
      title: '',
      subtitle: '',
      shareable: false,
      editable: false,
      validable: true,
      searchable: false,
      importable: false,
      searchPlaceholders: 'Rechercher'
    };
  }

  /**
   * Page éditable, partageable et non validable
   *
   * @static
   * @returns {IPageData}
   * @memberof Global
   */
  public static getShareEditPageData(): IPageData {
    return {
      title: '',
      subtitle: '',
      shareable: true,
      editable: true,
      validable: false,
      searchable: false,
      importable: false,
      searchPlaceholders: 'Rechercher'
    };
  }

  /**
   * Page éditable, non partageable et non validable
   *
   * @static
   * @returns {IPageData}
   * @memberof Global
   */
  public static getOnlyEditPageData(): IPageData {
    return {
      title: '',
      subtitle: '',
      shareable: false,
      editable: true,
      validable: false,
      searchable: false,
      importable: false,
      searchPlaceholders: 'Rechercher'
    };
  }

  /**************************************************************************/
  /******************************* CLOUD SHARE ******************************/
  /**************************************************************************/

  public static getBlankListPath(): ITodoListPath {
    return {
      userUUID: null,
      listUUID: null,
      shareByReference: false
    };
  }

  public static getDefaultCloudShareData(): ICloudSharedList {
    return {
      list: Global.getBlankListPath(),
      author: null,
      shakeToShare: false,
      name: null,
      password: null,
      email: null
    };
  }

  /**************************************************************************/
  /******************************** FALLBACK ********************************/
  /**************************************************************************/

  public static readonly BLANK_LIST: ITodoList = {
    uuid: null,
    name: null,
    externTodos: [],
    icon: null,
    order: 0,
    author: null
  };

  public static getBlankTodo(): ITodoItem {
    return {
      uuid: null,
      name: null,
      desc: null,
      author: null,
      complete: false
    };
  }

  /**************************************************************************/
  /********************************* HELPER *********************************/
  /**************************************************************************/

  public static precisionRound(number: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  }

  public static roundILatLng(pos: ILatLng): ILatLng {
    return {
      lat: Global.precisionRound(pos.lat, 3),
      lng: Global.precisionRound(pos.lng, 3)
    };
  }

  public static getGeoPoint(p: ILatLng): firebase.firestore.GeoPoint {
    return new firebase.firestore.GeoPoint(p.lat, p.lng);
  }

  public static getILatLng(p: firebase.firestore.GeoPoint): ILatLng {
    return { lat: p.latitude, lng: p.longitude };
  }

  /**
   * Formule de haversine pour calculer la distance entre deux points
   *
   * @static
   * @param {firebase.firestore.GeoPoint} p1
   * @param {firebase.firestore.GeoPoint} p2
   * @returns {number}
   * @memberof Global
   */
  public static geoDistance(
    p1: firebase.firestore.GeoPoint,
    p2: firebase.firestore.GeoPoint
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = Global.deg2rad(p2.latitude - p1.latitude);
    const dLon = Global.deg2rad(p2.longitude - p1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Global.deg2rad(p1.latitude)) *
        Math.cos(Global.deg2rad(p2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 2;
    return R * c;
  }

  /**
   * Degrés vers Radian
   *
   * @static
   * @param {number} deg
   * @returns {number}
   * @memberof Global
   */
  public static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
