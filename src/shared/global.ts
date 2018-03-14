import { ITodoList } from './../model/todo-list';
import { IPageData } from './../model/page-data';

/**
 * Contient des structure de données constante (ou semi constante)
 * pouvent être réutilisée par les composant de l'application
 *
 * @export
 * @class Global
 */
export class Global {
  /**************************************************************************/
  /******************************* ROOT PAGES *******************************/
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
  /********************************* MAGIC **********************************/
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
  /*********************** DEFAULT PAGE DATA (HEADER) ***********************/
  /**************************************************************************/

  /**
   * Page non éditable, non partageable et non validable
   *
   * @readonly
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly DEFAULT_PAGE_DATA: IPageData = {
    title: 'Edit me!',
    shareable: false,
    editable: false,
    validable: false
  };

  /**
   * Page non éditable, non partageable et validable
   *
   * @readonly
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly VALIDABLE_PAGE_DATA: IPageData = {
    title: 'Edit me',
    shareable: false,
    editable: false,
    validable: true
  };

  /**
   *  Page éditable, partageable et non validable
   *
   * @readonly
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly SHARE_EDIT_PAGE_DATA: IPageData = {
    title: 'Edit me',
    shareable: true,
    editable: true,
    validable: false
  };

  /**
   * Page éditable, non partageable et non validable
   *
   * @readonly
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly ONLY_EDIT_PAGE_DATA: IPageData = {
    title: 'Edit me',
    shareable: false,
    editable: true,
    validable: false
  };

  /**
   * donnée du header global (unique et global...)
   *
   * @static
   * @type {IPageData}
   * @memberof Global
   */
  public static HEADER: IPageData = Global.DEFAULT_PAGE_DATA;

  /**************************************************************************/
  /**************************** DEFAULT TODOLIST ****************************/
  /**************************************************************************/

  public static readonly BLANK_LIST: ITodoList = {
    uuid: null,
    name: null,
    items: [],
    icon: null
  };

  /**************************************************************************/
  /********************************* TOPICS *********************************/
  /**************************************************************************/

  /**
   * Flux des commandes menu de l'utilisateur pour les pages intéressées (enrichie éventuelement)
   *
   * @static
   * @readonly
   * @memberof Global
   */
  public static readonly MENU_REQ_TOPIC = 'menu:request';

  /**
   * Permet d'envoyer/recevoir des demande de navigation simple de la part de composant
   *
   * @static
   * @memberof Global
   */
  public static readonly BASIC_NAVIGATION_TOPIC = 'nav:request';
}
