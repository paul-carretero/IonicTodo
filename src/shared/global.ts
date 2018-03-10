import { Settings } from './../model/settings';
import { PageData } from './../model/page-data';

/**
 * Contient des structure de données constante (ou semi constante)
 * pouvent être réutilisée par les composant de l'application
 *
 * @export
 * @class Global
 */
export class Global {
  /**
   * Index de la page d'accueil
   *
   * @static
   * @memberof Global
   */
  public static readonly HOMEPAGE = 0;

  /**
   * Index de la page d'authentification
   *
   * @static
   * @memberof Global
   */
  public static readonly AUTHPAGE = 1;

  /**
   * Index de la page d'options
   *
   * @static
   * @memberof Global
   */
  public static readonly OPTSPAGE = 2;

  /**
   * Page non éditable, non partageable et non validable
   *
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly DEFAULT_PAGE_DATA: PageData = {
    title: 'Edit me!',
    shareable: false,
    editable: false,
    validable: false
  };

  /**
   * Page non éditable, non partageable et validable
   *
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly VALIDABLE_PAGE_DATA: PageData = {
    title: 'Edit me',
    shareable: false,
    editable: false,
    validable: true
  };

  /**
   *  Page éditable, partageable et non validable
   *
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly SHARE_EDIT_PAGE_DATA: PageData = {
    title: 'Edit me',
    shareable: true,
    editable: true,
    validable: false
  };

  /**
   * Page éditable, non partageable et non validable
   *
   * @static
   * @type {PageData}
   * @memberof Global
   */
  public static readonly ONLY_EDIT_PAGE_DATA: PageData = {
    title: 'Edit me',
    shareable: false,
    editable: true,
    validable: false
  };
}
