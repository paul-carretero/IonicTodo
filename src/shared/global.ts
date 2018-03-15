import { ICloudSharedList } from './../model/cloud-shared-list';
import { ITodoList } from './../model/todo-list';
import { IPageData } from './../model/page-data';
import { ILatLng } from '@ionic-native/google-maps';

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
  /***************************** MAGIC STRING *******************************/
  /**************************************************************************/

  /**
   * Identifie une liste de todo, pour deserialization
   *
   * @readonly
   * @static
   * @type {string}
   * @memberof Global
   */
  public static readonly TODO_LIST_MAGIC: string = '(╯°□°）╯︵ ┻━┻';

  /**
   * Identifie un lien vers une liste de todo pour désérialisation
   *
   * @readonly
   * @static
   * @type {string}
   * @memberof Global
   */
  public static readonly LIST_PATH_MAGIC: string = '┬─┬ノ( º _ ºノ)';

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
      title: 'Edit me!',
      shareable: false,
      editable: false,
      validable: false
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
      title: 'Edit me',
      shareable: false,
      editable: false,
      validable: true
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
      title: 'Edit me',
      shareable: true,
      editable: true,
      validable: false
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
      title: 'Edit me',
      shareable: false,
      editable: true,
      validable: false
    };
  }

  /**************************************************************************/
  /******************************* CLOUD SHARE ******************************/
  /**************************************************************************/

  public static getDefaultCloudShareData(): ICloudSharedList {
    return {
      list: Global.BLANK_LIST
    };
  }

  /**************************************************************************/
  /******************************** FALLBACK ********************************/
  /**************************************************************************/

  public static readonly BLANK_LIST: ITodoList = {
    uuid: null,
    name: null,
    items: [],
    icon: null
  };

  /**************************************************************************/
  /********************************* HELPER *********************************/
  /**************************************************************************/

  public static precisionRound(number, precision): number {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  }

  public static roundILatLng(pos: ILatLng): ILatLng {
    return {
      lat: Global.precisionRound(pos.lat, 3),
      lng: Global.precisionRound(pos.lng, 3)
    };
  }
}
