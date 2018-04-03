import { IPlanifiedSms } from './../model/planified-sms';
import { ILatLng } from '@ionic-native/google-maps';
import * as firebase from 'firebase';

import { IListMetadata } from '../model/list-metadata';
import { ITodoItem } from '../model/todo-item';
import { ITodoList } from '../model/todo-list';
import { ITodoListPath } from '../model/todo-list-path';
import { ICloudSharedList } from './../model/cloud-shared-list';
import { IPageData } from './../model/page-data';
import { ISimpleContact } from './../model/simple-contact';

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
      searchPlaceholders: 'Rechercher',
      copiable: false,
      pastable: false,
      isList: false
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
      searchPlaceholders: 'Rechercher',
      copiable: false,
      pastable: false,
      isList: false
    };
  }

  /**
   * Page éditable, partageable et non validable.
   * Utilisable pour afficher une liste
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
      searchPlaceholders: 'Rechercher',
      copiable: false,
      pastable: true,
      isList: false
    };
  }

  /**
   * Page éditable, copiable, non partageable et non validable.
   * Utilisable pour afficher un todo
   *
   * @static
   * @returns {IPageData}
   * @memberof Global
   */
  public static getEditCopyPageData(): IPageData {
    return {
      title: '',
      subtitle: '',
      shareable: false,
      editable: true,
      validable: false,
      searchable: false,
      importable: false,
      searchPlaceholders: 'Rechercher',
      copiable: true,
      pastable: false,
      isList: false
    };
  }

  /**************************************************************************/
  /******************************* CLOUD SHARE ******************************/
  /**************************************************************************/

  /**
   * retourne un chemin de liste vide
   *
   * @static
   * @returns {ITodoListPath}
   * @memberof Global
   */
  public static getBlankListPath(): ITodoListPath {
    return {
      userUUID: null,
      listUUID: null,
      shareByReference: false
    };
  }

  /**
   * retourne un objet de partage cloud vide
   *
   * @static
   * @returns {ICloudSharedList}
   * @memberof Global
   */
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

  /**
   * retourne un objet de liste vide
   *
   * @public
   * @static
   * @returns {ITodoList}
   * @memberof Global
   */
  public static getBlankList(): ITodoList {
    return {
      uuid: null,
      name: null,
      externTodos: [],
      icon: null,
      order: 0,
      author: null,
      metadata: Global.getBlankMetaData()
    };
  }

  /**
   * retourne un objet todo vide
   *
   * @public
   * @static
   * @returns {ITodoItem}
   * @memberof Global
   */
  public static getBlankTodo(): ITodoItem {
    return {
      uuid: null,
      ref: null,
      name: null,
      desc: null,
      deadline: null,
      notif: null,
      address: null,
      complete: false,
      sendSMS: false,
      contacts: [],
      pictures: [],
      order: 0,
      author: null,
      completeAuthor: null
    };
  }

  /**
   * retourne des métadata vide pour une liste
   *
   * @public
   * @static
   * @returns {IListMetadata}
   * @memberof Global
   */
  public static getBlankMetaData(): IListMetadata {
    return {
      todoComplete: 0,
      todoTotal: 0,
      atLeastOneLate: false
    };
  }

  /**
   * retourne un contact par défault
   *
   * @public
   * @static
   * @returns {ISimpleContact}
   * @memberof Global
   */
  public static getBlankContact(): ISimpleContact {
    return {
      id: Math.round(Math.random() * 1000000000000),
      displayName: null,
      email: null,
      mobile: null
    };
  }

  /**
   * retourne un objet de sms plannifié vide
   *
   * @public
   * @static
   * @returns {IPlanifiedSms}
   * @memberof Global
   */
  public static getBlankPlanifiedSms(): IPlanifiedSms {
    return {
      smsUuid: '',
      date: new Date(),
      contacts: [],
      message: ''
    };
  }

  /**************************************************************************/
  /********************************* HELPER *********************************/
  /**************************************************************************/

  /**
   * permet d'arrondire un float avec une précision donnée
   *
   * @static
   * @param {number} number
   * @param {number} precision
   * @returns {number}
   * @memberof Global
   */
  public static precisionRound(number: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  }

  /**
   * arrondi les coordonné d'un ILatLng
   *
   * @static
   * @param {ILatLng} pos
   * @returns {ILatLng}
   * @memberof Global
   */
  public static roundILatLng(pos: ILatLng): ILatLng {
    return {
      lat: Global.precisionRound(pos.lat, 1),
      lng: Global.precisionRound(pos.lng, 1)
    };
  }

  /**
   * converti un ILatLng en geopoint
   *
   * @static
   * @param {ILatLng} p
   * @returns {firebase.firestore.GeoPoint}
   * @memberof Global
   */
  public static getGeoPoint(p: ILatLng): firebase.firestore.GeoPoint {
    return new firebase.firestore.GeoPoint(p.lat, p.lng);
  }

  /**
   * converti un geopoint en ILatLng
   *
   * @static
   * @param {firebase.firestore.GeoPoint} p
   * @returns {ILatLng}
   * @memberof Global
   */
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
